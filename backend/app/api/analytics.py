from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics & Decision Intelligence"])

@router.get("/dashboard")
def get_dashboard_analytics(
    department: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    metrics = analytics_service.calculate_dashboard_metrics(
        db=db,
        department=department,
        role=role,
        status=status,
        stage=stage,
        date_from=date_from,
        date_to=date_to
    )
    return metrics
