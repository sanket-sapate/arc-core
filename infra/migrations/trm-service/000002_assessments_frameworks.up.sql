-- Add missing fields to frameworks
ALTER TABLE frameworks ADD COLUMN description TEXT;
ALTER TABLE frameworks ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Framework Questions
CREATE TABLE framework_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'text',
    options JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Cycles
CREATE TABLE audit_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'planned',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update Assessments to link to audit cycles
ALTER TABLE assessments ADD COLUMN audit_cycle_id UUID REFERENCES audit_cycles(id) ON DELETE SET NULL;

-- Assessment Answers
CREATE TABLE assessment_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_id UUID REFERENCES framework_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    answer_options JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(assessment_id, question_id)
);
