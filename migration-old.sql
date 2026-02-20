-- Extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums

DO $$ BEGIN CREATE TYPE audit_cycle_status AS ENUM ('planned', 'active', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE assessment_status AS ENUM ('draft', 'in_review', 'completed', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE answer_status AS ENUM ('draft', 'submitted', 'approved', 'changes_requested'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Functions

CREATE OR REPLACE FUNCTION public.process_audit_log()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_id uuid;
    v_old_data jsonb;
    v_new_data jsonb;
    v_entity_id uuid;
BEGIN
    -- 1. Try to get User ID from a session variable (set by your Go app)
    -- Your Go code would run: SET LOCAL app.current_user_id = '...'
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- 2. Extract Data and Entity ID
    IF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        IF (v_new_data ? 'id') THEN
            v_entity_id := (v_new_data ->> 'id')::uuid;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        IF (v_new_data ? 'id') THEN
            v_entity_id := (v_new_data ->> 'id')::uuid;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        IF (v_old_data ? 'id') THEN
            v_entity_id := (v_old_data ->> 'id')::uuid;
        END IF;
    END IF;

    -- 3. Insert Audit Log
    INSERT INTO public.audit_logs (
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id, -- This will be NULL unless you set app.current_user_id
        TG_OP,
        TG_TABLE_NAME,
        v_entity_id,
        v_old_data,
        v_new_data,
        now()
    );

    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(uid uuid)
 RETURNS TABLE(permission_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.code
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = uid;
END;
$function$;


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;


-- Tables

CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email character varying NOT NULL UNIQUE,
    encrypted_password character varying, -- If you store passwords yourself
    email_confirmed_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.vendors (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text,
    contact_email text,
    address text,
    processing_location text,
    security_certifications text,
    compliance_status text,
    status character varying DEFAULT 'active'::character varying,
    risk_score numeric DEFAULT 0,
    risk_level character varying DEFAULT 'low'::character varying,
    data_objects text[],
    data_subjects text[],
    processing_locations text[],
    security_certifications_list text[],
    sub_processors jsonb,
    onboarding_status character varying DEFAULT 'pending'::character varying,
    requires_assessment boolean DEFAULT false,
    requires_dpa boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    data_object_justifications jsonb DEFAULT '{}'::jsonb,
    user_id uuid,
    CONSTRAINT vendors_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.audit_cycles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status audit_cycle_status NOT NULL DEFAULT 'planned'::audit_cycle_status,
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT audit_cycles_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.audit_cycle_vendors (
    audit_cycle_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_cycle_vendors_pkey PRIMARY KEY (audit_cycle_id, vendor_id)
);CREATE TABLE IF NOT EXISTS public.frameworks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    version character varying NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT frameworks_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.questions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    framework_id uuid NOT NULL,
    control_id character varying,
    section_title character varying,
    text text NOT NULL,
    help_text text,
    ui_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    evidence_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    display_order integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    deleted_by uuid,
    acceptable_evidence text,
    CONSTRAINT questions_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.assessments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    vendor_id uuid,
    assessment_type character varying DEFAULT 'vendor'::character varying,
    framework_id uuid NOT NULL,
    audit_cycle_id uuid,
    name text NOT NULL,
    status assessment_status DEFAULT 'draft'::assessment_status,
    due_date timestamp with time zone,
    auditor_id uuid,
    internal_poc_id uuid,
    vendor_poc_id uuid,
    template_id uuid,
    score integer,
    risk_flag boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT assessments_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.assessment_answers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    assessment_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer_boolean boolean,
    answer_text text,
    is_na boolean DEFAULT false,
    explanation text,
    auditor_flag boolean DEFAULT false,
    auditor_comment text,
    status answer_status DEFAULT 'draft'::answer_status,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT assessment_answers_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.dpas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL,
    template_id uuid,
    status character varying NOT NULL DEFAULT 'draft'::character varying,
    current_phase character varying,
    form_data jsonb,
    document_path text,
    pdf_hash text,
    expiry_date timestamp with time zone,
    signed_at timestamp with time zone,
    signer_email character varying,
    signer_ip character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT dpas_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.evidence_files (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    assessment_answer_id uuid,
    file_path text,
    original_name text,
    mime_type text,
    size_bytes integer,
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT evidence_files_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.cookie_banners (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    domain text,
    name text,
    active boolean DEFAULT true,
    config jsonb DEFAULT '{}'::jsonb,
    styles jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title text,
    message text,
    accept_button_text text,
    reject_button_text text,
    settings_button_text text,
    position text,
    theme text,
    CONSTRAINT cookie_banners_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.cookie_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text,
    description text,
    required boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cookie_categories_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.cookie_consents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    anonymous_id text,
    user_id uuid,
    domain text,
    consents jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cookie_consents_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.script_blocking_rules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    domain text NOT NULL,
    script_pattern text NOT NULL,
    category_id uuid,
    block_until_consent boolean DEFAULT true,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT script_blocking_rules_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.data_dictionary (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text,
    description text,
    sensitivity text DEFAULT 'medium'::text,
    active boolean DEFAULT true,
    properties jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT data_dictionary_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.dpias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    vendor_id uuid,
    status text DEFAULT 'draft'::text,
    risk_level text DEFAULT 'medium'::text,
    form_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    processing_purpose text,
    processing_description text,
    overall_risk_score integer DEFAULT 0,
    dpo_consulted boolean DEFAULT false,
    necessity_assessment text,
    proportionality_assessment text,
    mitigation_measures text,
    alternatives_considered text,
    description text,
    data_categories text[],
    data_subjects text[],
    residual_risk_level text,
    dpo_comments text,
    stakeholders_consulted text,
    conducted_by uuid,
    approved_by uuid,
    approved_at timestamp with time zone,
    review_date date,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT dpias_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.ropas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    processing_activity text,
    purposes text[],
    data_categories text[],
    recipients text[],
    safeguards text,
    retention_period text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    legal_basis text,
    dpia_required boolean DEFAULT false,
    dpo_notified boolean DEFAULT false,
    encryption_used boolean DEFAULT false,
    pseudonymization_used boolean DEFAULT false,
    security_measures text,
    has_international_transfer boolean DEFAULT false,
    automated_decision_making boolean DEFAULT false,
    profiling_used boolean DEFAULT false,
    description text,
    purpose_ids uuid[],
    data_dictionary_ids uuid[],
    processing_activity_name text,
    data_subjects text[],
    purpose text,
    special_category_data text[],
    transfer_countries text[],
    transfer_safeguards text,
    retention_criteria text,
    access_controls text,
    automated_decision_logic text,
    profiling_description text,
    controller_name text,
    controller_contact text,
    processor_name text,
    processor_contact text,
    legitimate_interest_description text,
    dpia_id uuid,
    owner_id uuid,
    last_reviewed_date date,
    next_review_date date,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT ropas_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.purposes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    legal_basis text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version text DEFAULT '1.0'::text,
    required boolean DEFAULT false,
    review_cycle_months integer DEFAULT 12,
    is_third_party boolean DEFAULT false,
    data_objects text[] DEFAULT '{}'::text[],
    vendors text[] DEFAULT '{}'::text[],
    category text DEFAULT 'Other'::text,
    CONSTRAINT purposes_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.consent_forms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    version integer DEFAULT 1,
    active boolean DEFAULT true,
    form_config jsonb DEFAULT '{}'::jsonb,
    purposes uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title text,
    CONSTRAINT consent_forms_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.privacy_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL,
    status text DEFAULT 'pending'::text,
    requester_email text,
    requester_name text,
    description text,
    resolution text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT privacy_requests_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now(),
    user_email text,
    details text,
    user_agent text,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text,
    type text DEFAULT 'info'::text,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.webhooks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    url text NOT NULL,
    events text[] DEFAULT '{}'::text[],
    active boolean DEFAULT true,
    secret text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT webhooks_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.purpose_vendor_links (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    purpose_id uuid,
    vendor_id uuid,
    dpa_id uuid,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purpose_vendor_links_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.scanned_assets (
    asset_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    asset_type character varying NOT NULL,
    asset_path text NOT NULL,
    asset_name character varying NOT NULL,
    scan_timestamp timestamp with time zone NOT NULL DEFAULT now(),
    file_size bigint,
    file_extension character varying,
    mime_type character varying,
    created_date timestamp with time zone,
    modified_date timestamp with time zone,
    accessed_date timestamp with time zone,
    owner_uid character varying,
    permissions character varying,
    checksum_md5 character varying,
    checksum_sha256 character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT scanned_assets_pkey PRIMARY KEY (asset_id)
);CREATE TABLE IF NOT EXISTS public.scan_jobs (
    scan_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    source_id uuid NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    config jsonb,
    stats jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT scan_jobs_pkey PRIMARY KEY (scan_id)
);CREATE TABLE IF NOT EXISTS public.pii_findings (
    finding_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    scan_id uuid NOT NULL,
    source_id uuid NOT NULL,
    asset_id uuid,
    asset_path character varying,
    asset_type character varying NOT NULL,
    column_name character varying,
    pii_type character varying NOT NULL,
    pii_category character varying NOT NULL,
    pii_subcategory character varying,
    confidence_score numeric NOT NULL,
    validation_method character varying,
    matched_pattern text,
    matched_text text,
    context_snippet text,
    location_in_file text,
    remediation_status character varying DEFAULT 'pending'::character varying,
    risk_level character varying DEFAULT 'medium'::character varying,
    found_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pii_findings_pkey PRIMARY KEY (finding_id)
);CREATE TABLE IF NOT EXISTS public.data_lineage (
    lineage_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    source_asset_id uuid,
    target_asset_id uuid,
    lineage_type character varying NOT NULL,
    transformation_details jsonb,
    discovered_at timestamp with time zone DEFAULT now(),
    confidence_score numeric,
    CONSTRAINT data_lineage_pkey PRIMARY KEY (lineage_id)
);CREATE TABLE IF NOT EXISTS public.asset_access_logs (
    log_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    asset_id uuid,
    access_timestamp timestamp with time zone NOT NULL DEFAULT now(),
    access_type character varying NOT NULL,
    user_identity character varying,
    ip_address inet,
    user_agent text,
    CONSTRAINT asset_access_logs_pkey PRIMARY KEY (log_id)
);CREATE TABLE IF NOT EXISTS public.asset_metadata (
    metadata_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    asset_id uuid,
    metadata_key character varying NOT NULL,
    metadata_value jsonb NOT NULL,
    metadata_type character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT asset_metadata_pkey PRIMARY KEY (metadata_id)
);CREATE TABLE IF NOT EXISTS public.scan_history (
    scan_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    scan_type character varying NOT NULL,
    scan_scope text NOT NULL,
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone,
    status character varying DEFAULT 'running'::character varying,
    assets_scanned integer DEFAULT 0,
    pii_findings_count integer DEFAULT 0,
    errors_count integer DEFAULT 0,
    scan_config jsonb,
    error_details text,
    CONSTRAINT scan_history_pkey PRIMARY KEY (scan_id)
);CREATE TABLE IF NOT EXISTS public.remote_servers (
    server_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    server_name character varying NOT NULL,
    server_type character varying NOT NULL,
    hostname character varying NOT NULL,
    port integer DEFAULT 22,
    auth_method character varying NOT NULL,
    ssh_username character varying,
    ssh_key_path text,
    ssh_passphrase_encrypted text,
    connection_status character varying DEFAULT 'not_tested'::character varying,
    last_scan_timestamp timestamp with time zone,
    agent_version character varying,
    resource_limits jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT remote_servers_pkey PRIMARY KEY (server_id)
);CREATE TABLE IF NOT EXISTS public.consents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text,
    form_id uuid,
    preferences jsonb,
    user_agent text,
    ip_address text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT consents_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.script_blocking (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    url_pattern text NOT NULL,
    purpose_id text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT script_blocking_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.grievances (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid,
    subject text NOT NULL,
    description text,
    status text DEFAULT 'open'::text,
    priority text DEFAULT 'medium'::text,
    category text,
    grievance_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT grievances_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.breach_notification_templates (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text NOT NULL,
    subject_template text,
    body_template text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT breach_notification_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.breach_notifications (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    template_id uuid,
    recipient_id text,
    status text,
    sent_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT breach_notifications_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    key_value text NOT NULL,
    label text NOT NULL,
    scopes text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    last_used_at timestamp with time zone,
    revoked boolean NOT NULL DEFAULT false,
    created_by uuid,
    CONSTRAINT api_keys_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.cookie_scans (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    url text NOT NULL,
    status text NOT NULL DEFAULT 'Pending'::text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT cookie_scans_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.scanned_cookies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    scan_id uuid,
    name text NOT NULL,
    domain text NOT NULL,
    path text,
    secure boolean DEFAULT false,
    http_only boolean DEFAULT false,
    expiration timestamp with time zone,
    category text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    same_site text,
    source text,
    description text,
    CONSTRAINT scanned_cookies_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.breach_configuration (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    severity_levels jsonb DEFAULT '{"low": 72, "high": 24, "medium": 48}'::jsonb,
    notification_templates jsonb DEFAULT '{}'::jsonb,
    auto_notify boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    dpo_email text,
    sender_email text,
    sender_name text,
    alert_rules jsonb DEFAULT '{"dpo_notification": false, "auto_notify_admin": false}'::jsonb,
    is_emergency_mode boolean DEFAULT false,
    CONSTRAINT breach_configuration_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.leads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    work_email text NOT NULL,
    company_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    marketing_consent boolean DEFAULT false,
    consent_receipt_id uuid,
    CONSTRAINT leads_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.user_consents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    purpose_id uuid NOT NULL,
    granted boolean DEFAULT false,
    granted_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_consents_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.data_sources (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    connection_details jsonb,
    status text DEFAULT 'active'::text,
    last_scan_at timestamp with time zone,
    frequency text DEFAULT 'manual'::text,
    next_scan_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT data_sources_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.discovery_scans (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    source_id uuid NOT NULL,
    status text NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    total_findings integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT discovery_scans_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.scan_findings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    scan_id uuid NOT NULL,
    source_id uuid NOT NULL,
    pii_type text NOT NULL,
    matched_text text,
    location text,
    confidence_score double precision,
    match_status text DEFAULT 'unmatched'::text,
    dictionary_entry_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    asset_id text,
    column_name text,
    asset_type text,
    CONSTRAINT scan_findings_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.dpa_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    template_path text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dpa_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.dpa_scope (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dpa_id uuid NOT NULL,
    data_dictionary_id uuid NOT NULL,
    justification text,
    CONSTRAINT dpa_scope_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.dpa_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dpa_id uuid NOT NULL,
    action text NOT NULL,
    actor_email text,
    signer_ip text,
    signer_user_agent text,
    pdf_hash text,
    verification_method text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dpa_transactions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.dpa_revisions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    dpa_id uuid NOT NULL,
    notes text,
    changes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dpa_revisions_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.dsr_integrations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    platform text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dsr_integrations_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    description text,
    module text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT permissions_pkey PRIMARY KEY (id)
);CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id)
);CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id)
);CREATE TABLE IF NOT EXISTS public.pii_patterns (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    regex text NOT NULL,
    active boolean DEFAULT true,
    system_defined boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pii_patterns_pkey PRIMARY KEY (id)
);
-- Foreign Keys

DO $$ BEGIN ALTER TABLE public.audit_cycle_vendors ADD CONSTRAINT audit_cycle_vendors_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.audit_cycle_vendors ADD CONSTRAINT audit_cycle_vendors_audit_cycle_id_fkey FOREIGN KEY (audit_cycle_id) REFERENCES public.audit_cycles(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.assessments ADD CONSTRAINT assessments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.assessments ADD CONSTRAINT assessments_audit_cycle_id_fkey FOREIGN KEY (audit_cycle_id) REFERENCES public.audit_cycles(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.assessments ADD CONSTRAINT assessments_framework_id_fkey FOREIGN KEY (framework_id) REFERENCES public.frameworks(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.dpas ADD CONSTRAINT dpas_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.dpias ADD CONSTRAINT dpias_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.purpose_vendor_links ADD CONSTRAINT purpose_vendor_links_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.purpose_vendor_links ADD CONSTRAINT purpose_vendor_links_purpose_id_fkey FOREIGN KEY (purpose_id) REFERENCES public.purposes(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.purpose_vendor_links ADD CONSTRAINT purpose_vendor_links_dpa_id_fkey FOREIGN KEY (dpa_id) REFERENCES public.dpas(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.questions ADD CONSTRAINT questions_framework_id_fkey FOREIGN KEY (framework_id) REFERENCES public.frameworks(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.assessment_answers ADD CONSTRAINT assessment_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.assessment_answers ADD CONSTRAINT assessment_answers_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.evidence_files ADD CONSTRAINT evidence_files_assessment_answer_id_fkey FOREIGN KEY (assessment_answer_id) REFERENCES public.assessment_answers(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.dpa_scope ADD CONSTRAINT dpa_scope_dpa_id_fkey FOREIGN KEY (dpa_id) REFERENCES public.dpas(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.dpa_scope ADD CONSTRAINT dpa_scope_data_dictionary_id_fkey FOREIGN KEY (data_dictionary_id) REFERENCES public.data_dictionary(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.dpa_revisions ADD CONSTRAINT dpa_revisions_dpa_id_fkey FOREIGN KEY (dpa_id) REFERENCES public.dpas(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.dpa_transactions ADD CONSTRAINT dpa_transactions_dpa_id_fkey FOREIGN KEY (dpa_id) REFERENCES public.dpas(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.script_blocking_rules ADD CONSTRAINT script_blocking_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.cookie_categories(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.user_consents ADD CONSTRAINT fk_user_consents_purpose FOREIGN KEY (purpose_id) REFERENCES public.purposes(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.consents ADD CONSTRAINT consents_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.consent_forms(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.data_lineage ADD CONSTRAINT data_lineage_source_asset_id_fkey FOREIGN KEY (source_asset_id) REFERENCES public.scanned_assets(asset_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.data_lineage ADD CONSTRAINT data_lineage_target_asset_id_fkey FOREIGN KEY (target_asset_id) REFERENCES public.scanned_assets(asset_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.pii_findings ADD CONSTRAINT pii_findings_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.scanned_assets(asset_id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.pii_findings ADD CONSTRAINT pii_findings_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.scan_jobs(scan_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.asset_access_logs ADD CONSTRAINT asset_access_logs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.scanned_assets(asset_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.asset_metadata ADD CONSTRAINT asset_metadata_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.scanned_assets(asset_id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.breach_notifications ADD CONSTRAINT breach_notifications_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.breach_notification_templates(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.scanned_cookies ADD CONSTRAINT scanned_cookies_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.cookie_scans(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.scan_findings ADD CONSTRAINT scan_findings_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.data_sources(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.scan_findings ADD CONSTRAINT scan_findings_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.discovery_scans(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.discovery_scans ADD CONSTRAINT discovery_scans_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.data_sources(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id); EXCEPTION WHEN duplicate_object THEN null; END $$;


-- Indexes

CREATE INDEX idx_users_email ON public.users(email);

CREATE INDEX idx_metadata_asset ON public.asset_metadata USING btree (asset_id);

CREATE UNIQUE INDEX unique_assessment_question ON public.assessment_answers USING btree (assessment_id, question_id);

CREATE INDEX idx_dpas_vendor_id ON public.dpas USING btree (vendor_id);

CREATE INDEX idx_dpas_status ON public.dpas USING btree (status);

CREATE UNIQUE INDEX data_dictionary_name_unique ON public.data_dictionary USING btree (name);

CREATE INDEX idx_assets_path ON public.scanned_assets USING btree (asset_path);

CREATE INDEX idx_assets_type ON public.scanned_assets USING btree (asset_type);

CREATE INDEX idx_assets_scan_time ON public.scanned_assets USING btree (scan_timestamp);

CREATE INDEX idx_scan_jobs_source ON public.scan_jobs USING btree (source_id);

CREATE INDEX idx_scan_jobs_status ON public.scan_jobs USING btree (status);

CREATE INDEX idx_pii_findings_scan ON public.pii_findings USING btree (scan_id);

CREATE INDEX idx_pii_findings_source ON public.pii_findings USING btree (source_id);

CREATE INDEX idx_pii_findings_asset ON public.pii_findings USING btree (asset_id);

CREATE INDEX idx_pii_findings_pii_type ON public.pii_findings USING btree (pii_type);

CREATE INDEX idx_pii_findings_risk ON public.pii_findings USING btree (risk_level);

CREATE INDEX idx_pii_findings_category ON public.pii_findings USING btree (pii_category);

CREATE INDEX idx_lineage_source ON public.data_lineage USING btree (source_asset_id);

CREATE INDEX idx_lineage_target ON public.data_lineage USING btree (target_asset_id);

CREATE INDEX idx_access_logs_asset ON public.asset_access_logs USING btree (asset_id);

CREATE INDEX idx_access_logs_time ON public.asset_access_logs USING btree (access_timestamp);

CREATE INDEX idx_consents_form_id ON public.consents USING btree (form_id);

CREATE INDEX idx_consents_user_id ON public.consents USING btree (user_id);

CREATE INDEX idx_remote_servers_type ON public.remote_servers USING btree (server_type);

CREATE INDEX idx_remote_servers_status ON public.remote_servers USING btree (connection_status);

CREATE INDEX idx_scan_history_status ON public.scan_history USING btree (status);

CREATE INDEX idx_scan_history_started ON public.scan_history USING btree (started_at);

CREATE INDEX idx_script_blocking_purpose_id ON public.script_blocking USING btree (purpose_id);

CREATE INDEX idx_api_keys_key_value ON public.api_keys USING btree (key_value) WHERE (NOT revoked);

CREATE INDEX idx_api_keys_created_at ON public.api_keys USING btree (created_at DESC);

CREATE INDEX idx_discovery_scans_source_id ON public.discovery_scans USING btree (source_id);

CREATE INDEX idx_scan_findings_scan_id ON public.scan_findings USING btree (scan_id);

CREATE INDEX idx_scan_findings_match_status ON public.scan_findings USING btree (match_status);
-- Triggers

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_audit_cycles_updated_at ON audit_cycles;
CREATE TRIGGER update_audit_cycles_updated_at BEFORE UPDATE ON audit_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_frameworks_updated_at ON frameworks;
CREATE TRIGGER update_frameworks_updated_at BEFORE UPDATE ON frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_answers_updated_at ON assessment_answers;
CREATE TRIGGER update_assessment_answers_updated_at BEFORE UPDATE ON assessment_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dpas_updated_at ON dpas;
CREATE TRIGGER update_dpas_updated_at BEFORE UPDATE ON dpas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cookie_banners_updated_at ON cookie_banners;
CREATE TRIGGER update_cookie_banners_updated_at BEFORE UPDATE ON cookie_banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cookie_categories_updated_at ON cookie_categories;
CREATE TRIGGER update_cookie_categories_updated_at BEFORE UPDATE ON cookie_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_script_blocking_rules_updated_at ON script_blocking_rules;
CREATE TRIGGER update_script_blocking_rules_updated_at BEFORE UPDATE ON script_blocking_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_dictionary_updated_at ON data_dictionary;
CREATE TRIGGER update_data_dictionary_updated_at BEFORE UPDATE ON data_dictionary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dpias_updated_at ON dpias;
CREATE TRIGGER update_dpias_updated_at BEFORE UPDATE ON dpias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ropas_updated_at ON ropas;
CREATE TRIGGER update_ropas_updated_at BEFORE UPDATE ON ropas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purposes_updated_at ON purposes;
CREATE TRIGGER update_purposes_updated_at BEFORE UPDATE ON purposes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consent_forms_updated_at ON consent_forms;
CREATE TRIGGER update_consent_forms_updated_at BEFORE UPDATE ON consent_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_privacy_requests_updated_at ON privacy_requests;
CREATE TRIGGER update_privacy_requests_updated_at BEFORE UPDATE ON privacy_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purpose_vendor_links_updated_at ON purpose_vendor_links;
CREATE TRIGGER update_purpose_vendor_links_updated_at BEFORE UPDATE ON purpose_vendor_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grievances_updated_at ON grievances;
CREATE TRIGGER update_grievances_updated_at BEFORE UPDATE ON grievances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_breach_notification_templates_updated_at ON breach_notification_templates;
CREATE TRIGGER update_breach_notification_templates_updated_at BEFORE UPDATE ON breach_notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_breach_configuration_updated_at ON breach_configuration;
CREATE TRIGGER update_breach_configuration_updated_at BEFORE UPDATE ON breach_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_consents_updated_at ON user_consents;
CREATE TRIGGER update_user_consents_updated_at BEFORE UPDATE ON user_consents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dsr_integrations_updated_at ON dsr_integrations;
CREATE TRIGGER update_dsr_integrations_updated_at BEFORE UPDATE ON dsr_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pii_patterns_updated_at ON pii_patterns;
CREATE TRIGGER update_pii_patterns_updated_at BEFORE UPDATE ON pii_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scanned_assets_updated_at ON scanned_assets;

CREATE TRIGGER update_scanned_assets_updated_at BEFORE UPDATE ON scanned_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_remote_servers_updated_at ON remote_servers;

CREATE TRIGGER update_remote_servers_updated_at BEFORE UPDATE ON remote_servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS audit_trigger ON asset_metadata;

CREATE TRIGGER audit_trigger AFTER INSERT ON asset_metadata FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON asset_metadata;

CREATE TRIGGER audit_trigger AFTER DELETE ON asset_metadata FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON asset_metadata;

CREATE TRIGGER audit_trigger AFTER UPDATE ON asset_metadata FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON audit_cycles;

CREATE TRIGGER audit_trigger AFTER INSERT ON audit_cycles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON audit_cycles;

CREATE TRIGGER audit_trigger AFTER DELETE ON audit_cycles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON audit_cycles;

CREATE TRIGGER audit_trigger AFTER UPDATE ON audit_cycles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON audit_cycle_vendors;

CREATE TRIGGER audit_trigger AFTER INSERT ON audit_cycle_vendors FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON audit_cycle_vendors;

CREATE TRIGGER audit_trigger AFTER DELETE ON audit_cycle_vendors FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON audit_cycle_vendors;

CREATE TRIGGER audit_trigger AFTER UPDATE ON audit_cycle_vendors FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON frameworks;

CREATE TRIGGER audit_trigger AFTER INSERT ON frameworks FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON frameworks;

CREATE TRIGGER audit_trigger AFTER DELETE ON frameworks FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON frameworks;

CREATE TRIGGER audit_trigger AFTER UPDATE ON frameworks FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON assessments;

CREATE TRIGGER audit_trigger AFTER INSERT ON assessments FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON assessments;

CREATE TRIGGER audit_trigger AFTER DELETE ON assessments FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON assessments;

CREATE TRIGGER audit_trigger AFTER UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON assessment_answers;

CREATE TRIGGER audit_trigger AFTER INSERT ON assessment_answers FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON assessment_answers;

CREATE TRIGGER audit_trigger AFTER DELETE ON assessment_answers FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON assessment_answers;

CREATE TRIGGER audit_trigger AFTER UPDATE ON assessment_answers FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpas;

CREATE TRIGGER audit_trigger AFTER INSERT ON dpas FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpas;

CREATE TRIGGER audit_trigger AFTER DELETE ON dpas FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpas;

CREATE TRIGGER audit_trigger AFTER UPDATE ON dpas FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON evidence_files;

CREATE TRIGGER audit_trigger AFTER INSERT ON evidence_files FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON evidence_files;

CREATE TRIGGER audit_trigger AFTER DELETE ON evidence_files FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON evidence_files;

CREATE TRIGGER audit_trigger AFTER UPDATE ON evidence_files FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_consents;

CREATE TRIGGER audit_trigger AFTER INSERT ON cookie_consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_consents;

CREATE TRIGGER audit_trigger AFTER DELETE ON cookie_consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_consents;

CREATE TRIGGER audit_trigger AFTER UPDATE ON cookie_consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON script_blocking_rules;

CREATE TRIGGER audit_trigger AFTER INSERT ON script_blocking_rules FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON script_blocking_rules;

CREATE TRIGGER audit_trigger AFTER DELETE ON script_blocking_rules FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON script_blocking_rules;

CREATE TRIGGER audit_trigger AFTER UPDATE ON script_blocking_rules FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_categories;

CREATE TRIGGER audit_trigger AFTER INSERT ON cookie_categories FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_categories;

CREATE TRIGGER audit_trigger AFTER DELETE ON cookie_categories FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_categories;

CREATE TRIGGER audit_trigger AFTER UPDATE ON cookie_categories FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_dictionary;

CREATE TRIGGER audit_trigger AFTER INSERT ON data_dictionary FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_dictionary;

CREATE TRIGGER audit_trigger AFTER DELETE ON data_dictionary FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_dictionary;

CREATE TRIGGER audit_trigger AFTER UPDATE ON data_dictionary FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON consent_forms;

CREATE TRIGGER audit_trigger AFTER INSERT ON consent_forms FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON consent_forms;

CREATE TRIGGER audit_trigger AFTER DELETE ON consent_forms FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON consent_forms;

CREATE TRIGGER audit_trigger AFTER UPDATE ON consent_forms FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON privacy_requests;

CREATE TRIGGER audit_trigger AFTER INSERT ON privacy_requests FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON privacy_requests;

CREATE TRIGGER audit_trigger AFTER DELETE ON privacy_requests FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON privacy_requests;

CREATE TRIGGER audit_trigger AFTER UPDATE ON privacy_requests FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON notifications;

CREATE TRIGGER audit_trigger AFTER INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON notifications;

CREATE TRIGGER audit_trigger AFTER DELETE ON notifications FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON notifications;

CREATE TRIGGER audit_trigger AFTER UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON webhooks;

CREATE TRIGGER audit_trigger AFTER INSERT ON webhooks FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON webhooks;

CREATE TRIGGER audit_trigger AFTER DELETE ON webhooks FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON webhooks;

CREATE TRIGGER audit_trigger AFTER UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON purpose_vendor_links;

CREATE TRIGGER audit_trigger AFTER INSERT ON purpose_vendor_links FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON purpose_vendor_links;

CREATE TRIGGER audit_trigger AFTER DELETE ON purpose_vendor_links FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON purpose_vendor_links;

CREATE TRIGGER audit_trigger AFTER UPDATE ON purpose_vendor_links FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON purposes;

CREATE TRIGGER audit_trigger AFTER INSERT ON purposes FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON purposes;

CREATE TRIGGER audit_trigger AFTER DELETE ON purposes FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON purposes;

CREATE TRIGGER audit_trigger AFTER UPDATE ON purposes FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON vendors;

CREATE TRIGGER audit_trigger AFTER INSERT ON vendors FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON vendors;

CREATE TRIGGER audit_trigger AFTER DELETE ON vendors FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON vendors;

CREATE TRIGGER audit_trigger AFTER UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON questions;

CREATE TRIGGER audit_trigger AFTER INSERT ON questions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON questions;

CREATE TRIGGER audit_trigger AFTER DELETE ON questions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON questions;

CREATE TRIGGER audit_trigger AFTER UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scanned_assets;

CREATE TRIGGER audit_trigger AFTER INSERT ON scanned_assets FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scanned_assets;

CREATE TRIGGER audit_trigger AFTER DELETE ON scanned_assets FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scanned_assets;

CREATE TRIGGER audit_trigger AFTER UPDATE ON scanned_assets FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_notification_templates;

CREATE TRIGGER audit_trigger AFTER INSERT ON breach_notification_templates FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_notification_templates;

CREATE TRIGGER audit_trigger AFTER DELETE ON breach_notification_templates FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_notification_templates;

CREATE TRIGGER audit_trigger AFTER UPDATE ON breach_notification_templates FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_jobs;

CREATE TRIGGER audit_trigger AFTER INSERT ON scan_jobs FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_jobs;

CREATE TRIGGER audit_trigger AFTER DELETE ON scan_jobs FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_jobs;

CREATE TRIGGER audit_trigger AFTER UPDATE ON scan_jobs FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_notifications;

CREATE TRIGGER audit_trigger AFTER INSERT ON breach_notifications FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_notifications;

CREATE TRIGGER audit_trigger AFTER DELETE ON breach_notifications FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_notifications;

CREATE TRIGGER audit_trigger AFTER UPDATE ON breach_notifications FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON pii_findings;

CREATE TRIGGER audit_trigger AFTER INSERT ON pii_findings FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON pii_findings;

CREATE TRIGGER audit_trigger AFTER DELETE ON pii_findings FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON pii_findings;

CREATE TRIGGER audit_trigger AFTER UPDATE ON pii_findings FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_lineage;

CREATE TRIGGER audit_trigger AFTER INSERT ON data_lineage FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_lineage;

CREATE TRIGGER audit_trigger AFTER DELETE ON data_lineage FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_lineage;

CREATE TRIGGER audit_trigger AFTER UPDATE ON data_lineage FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON asset_access_logs;

CREATE TRIGGER audit_trigger AFTER INSERT ON asset_access_logs FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON asset_access_logs;

CREATE TRIGGER audit_trigger AFTER DELETE ON asset_access_logs FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON asset_access_logs;

CREATE TRIGGER audit_trigger AFTER UPDATE ON asset_access_logs FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_history;

CREATE TRIGGER audit_trigger AFTER INSERT ON scan_history FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_history;

CREATE TRIGGER audit_trigger AFTER DELETE ON scan_history FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_history;

CREATE TRIGGER audit_trigger AFTER UPDATE ON scan_history FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON remote_servers;

CREATE TRIGGER audit_trigger AFTER INSERT ON remote_servers FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON remote_servers;

CREATE TRIGGER audit_trigger AFTER DELETE ON remote_servers FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON remote_servers;

CREATE TRIGGER audit_trigger AFTER UPDATE ON remote_servers FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON consents;

CREATE TRIGGER audit_trigger AFTER INSERT ON consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON consents;

CREATE TRIGGER audit_trigger AFTER DELETE ON consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON consents;

CREATE TRIGGER audit_trigger AFTER UPDATE ON consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON script_blocking;

CREATE TRIGGER audit_trigger AFTER INSERT ON script_blocking FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON script_blocking;

CREATE TRIGGER audit_trigger AFTER DELETE ON script_blocking FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON script_blocking;

CREATE TRIGGER audit_trigger AFTER UPDATE ON script_blocking FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_banners;

CREATE TRIGGER audit_trigger AFTER INSERT ON cookie_banners FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_banners;

CREATE TRIGGER audit_trigger AFTER DELETE ON cookie_banners FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_banners;

CREATE TRIGGER audit_trigger AFTER UPDATE ON cookie_banners FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON grievances;

CREATE TRIGGER audit_trigger AFTER INSERT ON grievances FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON grievances;

CREATE TRIGGER audit_trigger AFTER DELETE ON grievances FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON grievances;

CREATE TRIGGER audit_trigger AFTER UPDATE ON grievances FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON leads;

CREATE TRIGGER audit_trigger AFTER INSERT ON leads FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON leads;

CREATE TRIGGER audit_trigger AFTER DELETE ON leads FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON leads;

CREATE TRIGGER audit_trigger AFTER UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON api_keys;

CREATE TRIGGER audit_trigger AFTER INSERT ON api_keys FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON api_keys;

CREATE TRIGGER audit_trigger AFTER DELETE ON api_keys FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON api_keys;

CREATE TRIGGER audit_trigger AFTER UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_configuration;

CREATE TRIGGER audit_trigger AFTER INSERT ON breach_configuration FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_configuration;

CREATE TRIGGER audit_trigger AFTER DELETE ON breach_configuration FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON breach_configuration;

CREATE TRIGGER audit_trigger AFTER UPDATE ON breach_configuration FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_scans;

CREATE TRIGGER audit_trigger AFTER INSERT ON cookie_scans FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_scans;

CREATE TRIGGER audit_trigger AFTER DELETE ON cookie_scans FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON cookie_scans;

CREATE TRIGGER audit_trigger AFTER UPDATE ON cookie_scans FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scanned_cookies;

CREATE TRIGGER audit_trigger AFTER INSERT ON scanned_cookies FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scanned_cookies;

CREATE TRIGGER audit_trigger AFTER DELETE ON scanned_cookies FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scanned_cookies;

CREATE TRIGGER audit_trigger AFTER UPDATE ON scanned_cookies FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_findings;

CREATE TRIGGER audit_trigger AFTER INSERT ON scan_findings FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_findings;

CREATE TRIGGER audit_trigger AFTER DELETE ON scan_findings FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON scan_findings;

CREATE TRIGGER audit_trigger AFTER UPDATE ON scan_findings FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_sources;

CREATE TRIGGER audit_trigger AFTER INSERT ON data_sources FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_sources;

CREATE TRIGGER audit_trigger AFTER DELETE ON data_sources FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON data_sources;

CREATE TRIGGER audit_trigger AFTER UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON discovery_scans;

CREATE TRIGGER audit_trigger AFTER INSERT ON discovery_scans FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON discovery_scans;

CREATE TRIGGER audit_trigger AFTER DELETE ON discovery_scans FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON discovery_scans;

CREATE TRIGGER audit_trigger AFTER UPDATE ON discovery_scans FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpias;

CREATE TRIGGER audit_trigger AFTER INSERT ON dpias FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpias;

CREATE TRIGGER audit_trigger AFTER DELETE ON dpias FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpias;

CREATE TRIGGER audit_trigger AFTER UPDATE ON dpias FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON user_consents;

CREATE TRIGGER audit_trigger AFTER INSERT ON user_consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON user_consents;

CREATE TRIGGER audit_trigger AFTER DELETE ON user_consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON user_consents;

CREATE TRIGGER audit_trigger AFTER UPDATE ON user_consents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON ropas;

CREATE TRIGGER audit_trigger AFTER INSERT ON ropas FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON ropas;

CREATE TRIGGER audit_trigger AFTER DELETE ON ropas FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON ropas;

CREATE TRIGGER audit_trigger AFTER UPDATE ON ropas FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_templates;

CREATE TRIGGER audit_trigger AFTER INSERT ON dpa_templates FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_templates;

CREATE TRIGGER audit_trigger AFTER DELETE ON dpa_templates FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_templates;

CREATE TRIGGER audit_trigger AFTER UPDATE ON dpa_templates FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_scope;

CREATE TRIGGER audit_trigger AFTER INSERT ON dpa_scope FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_scope;

CREATE TRIGGER audit_trigger AFTER DELETE ON dpa_scope FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_scope;

CREATE TRIGGER audit_trigger AFTER UPDATE ON dpa_scope FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dsr_integrations;

CREATE TRIGGER audit_trigger AFTER INSERT ON dsr_integrations FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dsr_integrations;

CREATE TRIGGER audit_trigger AFTER DELETE ON dsr_integrations FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dsr_integrations;

CREATE TRIGGER audit_trigger AFTER UPDATE ON dsr_integrations FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_transactions;

CREATE TRIGGER audit_trigger AFTER INSERT ON dpa_transactions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_transactions;

CREATE TRIGGER audit_trigger AFTER DELETE ON dpa_transactions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_transactions;

CREATE TRIGGER audit_trigger AFTER UPDATE ON dpa_transactions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_revisions;

CREATE TRIGGER audit_trigger AFTER INSERT ON dpa_revisions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_revisions;

CREATE TRIGGER audit_trigger AFTER DELETE ON dpa_revisions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON dpa_revisions;

CREATE TRIGGER audit_trigger AFTER UPDATE ON dpa_revisions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON role_permissions;

CREATE TRIGGER audit_trigger AFTER INSERT ON role_permissions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON role_permissions;

CREATE TRIGGER audit_trigger AFTER DELETE ON role_permissions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON role_permissions;

CREATE TRIGGER audit_trigger AFTER UPDATE ON role_permissions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON roles;

CREATE TRIGGER audit_trigger AFTER INSERT ON roles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON roles;

CREATE TRIGGER audit_trigger AFTER DELETE ON roles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON roles;

CREATE TRIGGER audit_trigger AFTER UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON permissions;

CREATE TRIGGER audit_trigger AFTER INSERT ON permissions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON permissions;

CREATE TRIGGER audit_trigger AFTER DELETE ON permissions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON permissions;

CREATE TRIGGER audit_trigger AFTER UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON user_roles;

CREATE TRIGGER audit_trigger AFTER INSERT ON user_roles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON user_roles;

CREATE TRIGGER audit_trigger AFTER DELETE ON user_roles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON user_roles;

CREATE TRIGGER audit_trigger AFTER UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON pii_patterns;

CREATE TRIGGER audit_trigger AFTER INSERT ON pii_patterns FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON pii_patterns;

CREATE TRIGGER audit_trigger AFTER DELETE ON pii_patterns FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS audit_trigger ON pii_patterns;

CREATE TRIGGER audit_trigger AFTER UPDATE ON pii_patterns FOR EACH ROW EXECUTE FUNCTION process_audit_log();
