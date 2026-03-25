import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '~/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScanFinding {
    id: string;
    finding_id?: string;
    info_type: string;
    likelihood: string;
    location: string;
    table?: string;
    column?: string;
    path?: string;
    confidence?: number;
    sample_value?: string;
    job_id?: string;
    source_id?: string;
}

export interface MappingSummary {
    total_findings: number;
    matched: number;
    unmatched: number;
    ignored: number;
    unused_dict_count: number;
}

export interface MappedFinding extends ScanFinding {
    match_status: 'matched' | 'unmatched' | 'ignored';
    dict_entry_name?: string;
    dict_entry_id?: string;
}

// ── Local storage for mapping status ─────────────────────────────────────────
// Since the third-party scanner doesn't have native mapping support,
// we track approve/reject status locally

const MAPPING_STORAGE_KEY = 'arc_finding_mapping';

interface MappingState {
    [findingKey: string]: {
        status: 'approved' | 'rejected';
        dict_entry_id?: string;
        dict_entry_name?: string;
        timestamp: string;
    };
}

function getMappingState(): MappingState {
    try {
        const raw = localStorage.getItem(MAPPING_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function setMappingState(state: MappingState): void {
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(state));
}

function getFindingKey(f: ScanFinding): string {
    return `${f.info_type}::${f.location || ''}::${f.table || ''}::${f.column || ''}`;
}

// ── API Functions ────────────────────────────────────────────────────────────

const fetchFindings = async (page = 1, pageSize = 100): Promise<ScanFinding[]> => {
    const { data } = await api.get('/api/discovery/findings', {
        params: { page, page_size: pageSize },
    });
    // Handle both array and envelope responses
    if (Array.isArray(data)) return data;
    if (data?.findings && Array.isArray(data.findings)) return data.findings;
    return [];
};

export const approveFinding = async (finding: ScanFinding, dictEntryName: string): Promise<void> => {
    const state = getMappingState();
    state[getFindingKey(finding)] = {
        status: 'approved',
        dict_entry_name: dictEntryName,
        timestamp: new Date().toISOString(),
    };
    setMappingState(state);
};

export const rejectFinding = async (finding: ScanFinding): Promise<void> => {
    const state = getMappingState();
    state[getFindingKey(finding)] = {
        status: 'rejected',
        timestamp: new Date().toISOString(),
    };
    setMappingState(state);
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useFindings = (page = 1, pageSize = 100) =>
    useQuery({
        queryKey: ['discovery-findings', page, pageSize],
        queryFn: () => fetchFindings(page, pageSize),
        staleTime: 60_000,
        retry: false,
    });

export const useApproveFinding = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ finding, dictEntryName }: { finding: ScanFinding; dictEntryName: string }) =>
            approveFinding(finding, dictEntryName),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['discovery-findings'] });
            qc.invalidateQueries({ queryKey: ['dictionary'] });
        },
    });
};

export const useRejectFinding = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (finding: ScanFinding) => rejectFinding(finding),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['discovery-findings'] });
        },
    });
};

/** Helper to enrich raw findings with mapping state */
export function enrichFindings(
    findings: ScanFinding[],
    dictItems: { id: string; name: string; category: string }[],
): { mapped: MappedFinding[]; summary: MappingSummary; unusedDictEntries: typeof dictItems } {
    const state = getMappingState();
    const dictNames = new Set(dictItems.map((d) => d.name.toLowerCase()));
    const matchedDictNames = new Set<string>();

    const mapped: MappedFinding[] = findings.map((f) => {
        const key = getFindingKey(f);
        const mapping = state[key];

        // Check if the finding was manually approved or rejected
        if (mapping?.status === 'approved') {
            if (mapping.dict_entry_name) matchedDictNames.add(mapping.dict_entry_name.toLowerCase());
            return { ...f, match_status: 'matched' as const, dict_entry_name: mapping.dict_entry_name };
        }
        if (mapping?.status === 'rejected') {
            return { ...f, match_status: 'ignored' as const };
        }

        // Check if the info_type matches any dictionary entry name
        const infoTypeLower = f.info_type.toLowerCase().replace(/_/g, ' ');
        const matchedDict = dictItems.find(
            (d) => d.name.toLowerCase() === infoTypeLower || d.name.toLowerCase().includes(infoTypeLower) || infoTypeLower.includes(d.name.toLowerCase()),
        );

        if (matchedDict) {
            matchedDictNames.add(matchedDict.name.toLowerCase());
            return { ...f, match_status: 'matched' as const, dict_entry_name: matchedDict.name, dict_entry_id: matchedDict.id };
        }

        return { ...f, match_status: 'unmatched' as const };
    });

    const unusedDictEntries = dictItems.filter((d) => !matchedDictNames.has(d.name.toLowerCase()));

    const summary: MappingSummary = {
        total_findings: mapped.length,
        matched: mapped.filter((m) => m.match_status === 'matched').length,
        unmatched: mapped.filter((m) => m.match_status === 'unmatched').length,
        ignored: mapped.filter((m) => m.match_status === 'ignored').length,
        unused_dict_count: unusedDictEntries.length,
    };

    return { mapped, summary, unusedDictEntries };
}
