from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.api.auth import router as auth_router
from backend.app.api.requisitions import router as requisitions_router
from backend.app.api.candidates import router as candidates_router
from backend.app.api.applications import router as applications_router
from backend.app.api.interviews import router as interviews_router
from backend.app.api.evaluations import router as evaluations_router
from backend.app.api.offers import router as offers_router
from backend.app.api.approvals import router as approvals_router
from backend.app.api.exceptions import router as exceptions_router
from backend.app.api.audit import router as audit_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.copilot import router as copilot_router
from backend.app.api.synthetic import router as synthetic_router
from backend.app.models.entities import User
from backend.synthetic.generator import generator
from backend.synthetic.ground_truth import export_ground_truth
from backend.synthetic.validator import DataQualityValidator

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Recruitment Operations & Decision Intelligence Platform"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(requisitions_router, prefix=settings.API_V1_STR)
app.include_router(candidates_router, prefix=settings.API_V1_STR)
app.include_router(applications_router, prefix=settings.API_V1_STR)
app.include_router(interviews_router, prefix=settings.API_V1_STR)
app.include_router(evaluations_router, prefix=settings.API_V1_STR)
app.include_router(offers_router, prefix=settings.API_V1_STR)
app.include_router(approvals_router, prefix=settings.API_V1_STR)
app.include_router(exceptions_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(copilot_router, prefix=settings.API_V1_STR)
app.include_router(synthetic_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    # Database connection verification
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("[TalentFlow 360] Database is empty. Seeding Starter dataset...")
            generator.generate_all(db, mode="starter")
            export_ground_truth(generator.ground_truth_records)
            validator = DataQualityValidator(db)
            validator.validate_all()
            print("[TalentFlow 360] Seed complete.")
        else:
            print(f"[TalentFlow 360] Connected to database with {user_count} users.")
    except Exception as e:
        print(f"[TalentFlow 360] Startup DB check note: {e}")
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }
