from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, selectinload

from .database import Base, SessionLocal, engine, get_db
from .demo_data import seed_demo_data
from .dependencies import UPLOAD_DIR, ensure_directories
from .models import Application, Document, ValidationResult
from .schemas import (
    ApplicationCreate,
    ApplicationDetailResponse,
    ApplicationListItemResponse,
    ApplicationResponse,
    ChecklistValidationRequest,
    DocumentStatusResponse,
    DocumentResponse,
    OCRRequest,
    OCRResponse,
    PredictionRequest,
    ValidationResultResponse,
)
from .services.checklist import validate_checklist
from .services.consistency import compare_documents
from .services.document_classifier import validate_document_content
from .services.llm_risk import assess_risk_with_llm
from .services.ocr_service import ocr_service
from .services.predictor import predict_rejection
from .services.suggestions import build_suggestions


ensure_directories()

app = FastAPI(title="NagarikAI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_demo_data(db)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/applications", response_model=ApplicationResponse)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    application = Application(**payload.model_dump(by_alias=False))
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@app.put("/applications/{application_id}", response_model=ApplicationResponse)
def update_application(application_id: int, payload: ApplicationCreate, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    data = payload.model_dump(by_alias=False)
    application.applicant_name = data["applicant_name"]
    application.aadhaar_number = data["aadhaar_number"]
    application.address = data["address"]
    application.application_type = data["application_type"]
    application.project_type = data["project_type"]
    db.commit()
    db.refresh(application)
    return application


@app.get("/applications", response_model=list[ApplicationListItemResponse])
def list_applications(db: Session = Depends(get_db)):
    applications = (
        db.query(Application)
        .options(selectinload(Application.validation_result))
        .order_by(Application.created_at.desc(), Application.id.desc())
        .all()
    )

    response: list[ApplicationListItemResponse] = []
    for application in applications:
        validation = application.validation_result
        response.append(
            ApplicationListItemResponse(
                id=application.id,
                applicant_name=application.applicant_name,
                application_type=application.application_type,
                created_at=application.created_at,
                risk_label=validation.risk_label if validation else "Low",
                missing_documents=validation.missing_documents if validation else [],
                mismatch_warnings=validation.mismatch_warnings if validation else [],
                has_validation=validation is not None,
            )
        )

    return response


@app.get("/applications/{application_id}", response_model=ApplicationDetailResponse)
def get_application(application_id: int, db: Session = Depends(get_db)):
    application = (
        db.query(Application)
        .options(selectinload(Application.validation_result))
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    validation = application.validation_result
    validation_payload = None
    if validation:
        validation_payload = ValidationResultResponse(
            application_id=application.id,
            missing_documents=validation.missing_documents or [],
            document_statuses={},
            compliance_issues=validation.compliance_issues or [],
            mismatch_warnings=validation.mismatch_warnings or [],
            risk_score=validation.risk_score,
            risk_label=validation.risk_label,
            ai_suggestions=validation.ai_suggestions or [],
        )

    return ApplicationDetailResponse(
        id=application.id,
        applicant_name=application.applicant_name,
        aadhaar_number=application.aadhaar_number,
        address=application.address,
        application_type=application.application_type,
        project_type=application.project_type,
        created_at=application.created_at,
        validation_result=validation_payload,
    )


@app.delete("/applications/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(application)
    db.commit()
    return {"deleted": True, "application_id": application_id}


@app.post("/upload-documents", response_model=list[DocumentResponse])
async def upload_documents(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    application_id_raw = form.get("application_id")
    if not application_id_raw:
        raise HTTPException(status_code=400, detail="application_id is required")

    try:
        application_id = int(str(application_id_raw))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="application_id must be an integer") from exc

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    uploaded_records = []
    for document_type, uploaded_file in form.multi_items():
        if document_type == "application_id":
            continue
        if not getattr(uploaded_file, "filename", None):
            continue

        safe_name = Path(uploaded_file.filename).name.replace(" ", "_")
        destination = UPLOAD_DIR / f"{application_id}_{document_type}_{safe_name}"
        file_content = await uploaded_file.read()
        destination.write_bytes(file_content)

        extracted_text = ""
        extracted_metadata = {}
        try:
            ocr_result = ocr_service.extract(str(destination))
            extracted_text = ocr_result["extracted_text"]
            extracted_metadata = ocr_result["entities"]
        except Exception as exc:
            extracted_metadata = {"ocr_error": str(exc)}

        record = Document(
            application_id=application_id,
            document_type=document_type,
            file_path=str(destination),
            extracted_text=extracted_text,
            extracted_metadata=extracted_metadata,
        )
        db.add(record)
        uploaded_records.append(record)
    db.commit()
    for record in uploaded_records:
        db.refresh(record)
    return uploaded_records


@app.post("/ocr", response_model=OCRResponse)
def run_ocr(payload: OCRRequest, db: Session = Depends(get_db)):
    result = ocr_service.extract(payload.file_path)
    if payload.application_id and payload.document_type:
        document = (
            db.query(Document)
            .filter(
                Document.application_id == payload.application_id,
                Document.document_type == payload.document_type,
            )
            .order_by(Document.id.desc())
            .first()
        )
        if document:
            document.extracted_text = result["extracted_text"]
            document.extracted_metadata = result["entities"]
            db.commit()
    return {
        "file_path": payload.file_path,
        "extracted_text": result["extracted_text"],
        "entities": result["entities"],
    }


@app.post("/predict-rejection")
def predict(payload: PredictionRequest):
    return predict_rejection(payload.missing_documents, payload.mismatches, payload.compliance_issues)


@app.post("/validate-checklist", response_model=ValidationResultResponse)
def validate(payload: ChecklistValidationRequest, db: Session = Depends(get_db)):
    checklist = validate_checklist(payload.application_type, payload.uploaded_documents)
    extracted_documents = dict(payload.extracted_documents)
    document_issues: list[str] = []
    invalid_document_types: set[str] = set()
    document_statuses: dict[str, DocumentStatusResponse] = {
        document_type: DocumentStatusResponse(status="missing", issues=[])
        for document_type in checklist["required_documents"]
    }

    if payload.application_id:
        latest_documents = (
            db.query(Document)
            .filter(Document.application_id == payload.application_id)
            .order_by(Document.id.desc())
            .all()
        )
        latest_by_type: dict[str, Document] = {}
        for document in latest_documents:
            if document.document_type not in latest_by_type:
                latest_by_type[document.document_type] = document

        for document_type, document in latest_by_type.items():
            if document.document_type not in extracted_documents:
                extracted_documents[document.document_type] = document.extracted_metadata or {}
            ocr_error = (document.extracted_metadata or {}).get("ocr_error")
            if ocr_error:
                invalid_document_types.add(document.document_type)
                issue = f"OCR failed for {document.document_type.replace('_', ' ').title()}: {ocr_error}"
                document_issues.append(issue)
                if document_type in document_statuses:
                    document_statuses[document_type] = DocumentStatusResponse(status="invalid", issues=[issue])
                continue
            validation_issues = validate_document_content(document.document_type, document.extracted_text or "")
            if validation_issues:
                invalid_document_types.add(document.document_type)
                document_issues.extend(validation_issues)
                if document_type in document_statuses:
                    document_statuses[document_type] = DocumentStatusResponse(status="invalid", issues=validation_issues)
            elif document_type in document_statuses:
                document_statuses[document_type] = DocumentStatusResponse(status="valid", issues=[])

    mismatch_warnings = compare_documents(payload.form_data, extracted_documents)
    required_documents = set(checklist["required_documents"])
    effective_missing_documents = sorted(set(checklist["missing_documents"]) | (invalid_document_types & required_documents))
    compliance_issues = [
        f"Missing required document: {item.replace('_', ' ').title()}"
        for item in effective_missing_documents
    ] + sorted(set(document_issues))

    for missing_document in effective_missing_documents:
        existing = document_statuses.get(missing_document)
        if existing and existing.status == "invalid":
            continue
        document_statuses[missing_document] = DocumentStatusResponse(
            status="missing",
            issues=[f"Missing required document: {missing_document.replace('_', ' ').title()}"],
        )

    if not checklist["required_documents"]:
        compliance_issues.append(
            f"No checklist is configured for application type: {payload.application_type}."
        )
    prediction = predict_rejection(
        effective_missing_documents,
        mismatch_warnings,
        compliance_issues,
        required_document_count=len(required_documents),
    )
    llm_assessment = assess_risk_with_llm(
        application_type=payload.application_type,
        missing_documents=effective_missing_documents,
        mismatch_warnings=mismatch_warnings,
        compliance_issues=compliance_issues,
        form_data=payload.form_data,
    )
    suggestions = build_suggestions(effective_missing_documents, mismatch_warnings)

    final_risk_score = llm_assessment["risk_score"] if llm_assessment else prediction["risk_score"]
    final_risk_label = llm_assessment["risk_label"] if llm_assessment else prediction["risk_label"]
    risk_method = "llm" if llm_assessment else "rule_based"
    risk_summary = (
        llm_assessment["summary"]
        if llm_assessment
        else f"Rule-based assessment from missing documents and mismatches. Score: {prediction['risk_score']}%."
    )
    risk_reasons = llm_assessment["reasons"] if llm_assessment else []

    if llm_assessment:
        suggestions = [
            {
                "type": "llm_next_action",
                "english": llm_assessment["next_action"],
                "hindi": f"LLM recommendation: {llm_assessment['next_action']}",
            },
            *suggestions,
        ]

    if payload.application_id:
        record = db.query(ValidationResult).filter(ValidationResult.application_id == payload.application_id).first()
        if not record:
            record = ValidationResult(application_id=payload.application_id)
            db.add(record)
        record.missing_documents = effective_missing_documents
        record.compliance_issues = compliance_issues
        record.mismatch_warnings = mismatch_warnings
        record.risk_score = final_risk_score
        record.risk_label = final_risk_label
        record.ai_suggestions = suggestions
        db.commit()

    return {
        "application_id": payload.application_id,
        "missing_documents": effective_missing_documents,
        "document_statuses": document_statuses,
        "compliance_issues": compliance_issues,
        "mismatch_warnings": mismatch_warnings,
        "risk_score": final_risk_score,
        "risk_label": final_risk_label,
        "risk_method": risk_method,
        "risk_summary": risk_summary,
        "risk_reasons": risk_reasons,
        "rule_based_risk_score": prediction["risk_score"],
        "rule_based_risk_label": prediction["risk_label"],
        "llm_risk_score": llm_assessment["risk_score"] if llm_assessment else None,
        "llm_risk_label": llm_assessment["risk_label"] if llm_assessment else None,
        "llm_model": llm_assessment["model"] if llm_assessment else None,
        "ai_suggestions": suggestions,
    }
