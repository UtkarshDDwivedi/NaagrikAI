from sqlalchemy.orm import Session

from .models import Application, Document, ValidationResult


DEMO_APPLICATIONS = [
    {
        "applicant_name": "Ravi Verma",
        "aadhaar_number": "123412341234",
        "address": "Raipur",
        "application_type": "Sand Mining",
        "project_type": "Riverbed Sand Extraction",
        "documents": ["land_document", "mining_plan", "affidavit", "kml_file"],
    },
    {
        "applicant_name": "Sita Builders",
        "aadhaar_number": "567856785678",
        "address": "Bilaspur",
        "application_type": "Brick Kiln",
        "project_type": "Seasonal Kiln",
        "documents": ["land_document", "site_plan", "affidavit"],
    },
    {
        "applicant_name": "Metro Infra Ltd",
        "aadhaar_number": "999988887777",
        "address": "Durg",
        "application_type": "Infrastructure Project",
        "project_type": "Road Expansion",
        "documents": ["land_document", "project_report", "kml_file", "drone_video"],
    },
]


def seed_demo_data(db: Session) -> None:
    if db.query(Application).count() > 0:
        return

    for item in DEMO_APPLICATIONS:
        app = Application(
            applicant_name=item["applicant_name"],
            aadhaar_number=item["aadhaar_number"],
            address=item["address"],
            application_type=item["application_type"],
            project_type=item["project_type"],
        )
        db.add(app)
        db.flush()

        for document_type in item["documents"]:
            db.add(
                Document(
                    application_id=app.id,
                    document_type=document_type,
                    file_path=f"data/uploads/{app.id}_{document_type}.pdf",
                )
            )

        db.add(
            ValidationResult(
                application_id=app.id,
                missing_documents=[],
                compliance_issues=[],
                mismatch_warnings=[],
                risk_score=0.0,
                risk_label="Low",
                ai_suggestions=[],
            )
        )

    db.commit()
