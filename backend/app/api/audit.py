from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.entities import AuditLog, User
from backend.app.schemas.schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit and Traceability"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    entity: Optional[str] = None,
    action: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if entity and entity != "All":
        query = query.filter(AuditLog.entity == entity)
    if action and action != "All":
        query = query.filter(AuditLog.action == action)
    if entity_id:
        query = query.filter(AuditLog.entity_id.ilike(f"%{entity_id}%"))

    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    res = []
    for l in logs:
        resp = AuditLogResponse.from_orm(l)
        if l.user:
            resp.user_name = l.user.full_name
        res.append(resp)
    return res
