import { api } from "~/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    DictionaryItem,
    DictionaryItemFormValues,
} from "../types/dictionary";

// ── Query Keys ─────────────────────────────────────────────────────────────

const DICTIONARY_KEY = ["dictionary"] as const;

// ── API Fetchers ───────────────────────────────────────────────────────────

async function getDictionaryItems(): Promise<DictionaryItem[]> {
    const { data } = await api.get<DictionaryItem[]>(
        "/api/discovery/dictionary",
    );
    return data;
}

async function createDictionaryItem(
    values: DictionaryItemFormValues,
): Promise<DictionaryItem> {
    const { data } = await api.post<DictionaryItem>(
        "/api/discovery/dictionary",
        values,
    );
    return data;
}

async function updateDictionaryItem({
    id,
    ...values
}: DictionaryItemFormValues & { id: string }): Promise<DictionaryItem> {
    const { data } = await api.put<DictionaryItem>(
        `/api/discovery/dictionary/${id}`,
        values,
    );
    return data;
}

async function deleteDictionaryItem(id: string): Promise<void> {
    await api.delete(`/api/discovery/dictionary/${id}`);
}

// ── TanStack Query Hooks ───────────────────────────────────────────────────

export function useDictionaryItems() {
    return useQuery({
        queryKey: DICTIONARY_KEY,
        queryFn: getDictionaryItems,
    });
}

export function useCreateDictionaryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createDictionaryItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DICTIONARY_KEY });
        },
    });
}

export function useUpdateDictionaryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateDictionaryItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DICTIONARY_KEY });
        },
    });
}

export function useDeleteDictionaryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteDictionaryItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DICTIONARY_KEY });
        },
    });
}
