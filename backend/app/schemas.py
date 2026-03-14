from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ApplicationCreate(BaseModel):
    applicant_name: str = Field(..., alias="name")
    aadhaar_number: str
    address: str
    application_type: str
    project_type: str


class ApplicationResponse(BaseModel):
    id: int
    applicant_name: str
    aadhaar_number: str
    address: str
    application_type: str
    project_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationListItemResponse(BaseModel):
    id: int
    applicant_name: str
    application_type: str
    created_at: datetime
    risk_label: str = "Low"
    missing_documents: list[str] = Field(default_factory=list)
    mismatch_warnings: list[str] = Field(default_factory=list)
    has_validation: bool = False


class ApplicationDetailResponse(BaseModel):
    id: int
    applicant_name: str
    aadhaar_number: str
    address: str
    application_type: str
    project_type: str
    created_at: datetime
    validation_result: "ValidationResultResponse | None" = None


class DocumentUploadRequest(BaseModel):
    application_id: int
    documents: dict[str, str]


class OCRRequest(BaseModel):
    application_id: int | None = None
    file_path: str
    document_type: str | None = None


class OCRResponse(BaseModel):
    file_path: str
    extracted_text: str
    entities: dict[str, Any]


class ChecklistValidationRequest(BaseModel):
    application_id: int | None = None
    application_type: str
    uploaded_documents: list[str]
    form_data: dict[str, str] = Field(default_factory=dict)
    extracted_documents: dict[str, dict[str, Any]] = Field(default_factory=dict)


class PredictionRequest(BaseModel):
    missing_documents: list[str]
    mismatches: list[str] = Field(default_factory=list)
    compliance_issues: list[str] = Field(default_factory=list)


class DocumentStatusResponse(BaseModel):
    status: str
    issues: list[str] = Field(default_factory=list)


class ValidationResultResponse(BaseModel):
    application_id: int | None = None
    missing_documents: list[str]
    document_statuses: dict[str, DocumentStatusResponse] = Field(default_factory=dict)
    compliance_issues: list[str]
    mismatch_warnings: list[str]
    risk_score: float
    risk_label: str
    risk_method: str = "rule_based"
    risk_summary: str | None = None
    risk_reasons: list[str] = Field(default_factory=list)
    rule_based_risk_score: float = 0.0
    rule_based_risk_label: str = "Low"
    llm_risk_score: float | None = None
    llm_risk_label: str | None = None
    llm_model: str | None = None
    ai_suggestions: list[dict[str, str]]


class DocumentResponse(BaseModel):
    id: int
    application_id: int
    document_type: str
    file_path: str
    extracted_text: str | None = None
    extracted_metadata: dict[str, Any] | None = None
    created_at: datetime

    class Config:
        from_attributes = True
