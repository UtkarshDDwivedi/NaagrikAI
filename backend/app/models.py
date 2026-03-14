from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from .database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    applicant_name = Column(String(255), nullable=False)
    aadhaar_number = Column(String(12), nullable=False)
    address = Column(Text, nullable=False)
    application_type = Column(String(120), nullable=False)
    project_type = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    validation_result = relationship(
        "ValidationResult",
        back_populates="application",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(120), nullable=False)
    file_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=True)
    extracted_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application = relationship("Application", back_populates="documents")


class ValidationResult(Base):
    __tablename__ = "validation_results"

    application_id = Column(
        Integer,
        ForeignKey("applications.id", ondelete="CASCADE"),
        primary_key=True,
    )
    missing_documents = Column(JSON, nullable=False, default=list)
    compliance_issues = Column(JSON, nullable=False, default=list)
    mismatch_warnings = Column(JSON, nullable=False, default=list)
    risk_score = Column(Float, nullable=False, default=0.0)
    risk_label = Column(String(50), nullable=False, default="Low")
    ai_suggestions = Column(JSON, nullable=False, default=list)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    application = relationship("Application", back_populates="validation_result")
