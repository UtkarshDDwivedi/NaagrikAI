CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    applicant_name VARCHAR(255) NOT NULL,
    aadhaar_number VARCHAR(12) NOT NULL,
    address TEXT NOT NULL,
    application_type VARCHAR(120) NOT NULL,
    project_type VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(120) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    extracted_text TEXT,
    extracted_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_results (
    application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
    missing_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    compliance_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    mismatch_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    risk_label VARCHAR(50) NOT NULL DEFAULT 'Low',
    ai_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
