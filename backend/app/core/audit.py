import json
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from backend.app.models.entities import AuditLog

def log_audit_event(
    db: Session,
    action: str,
    entity: str,
    entity_id: str,
    previous_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    user_id: Optional[str] = None,
    reason: Optional[str] = None
) -> AuditLog:
    """
    Append-only immutable audit logging helper.
    Serializes objects or dicts into JSON strings.
    """
    prev_str = None
    if previous_value is not None:
        if isinstance(previous_value, (dict, list)):
            prev_str = json.dumps(previous_value, default=str)
        else:
            prev_str = str(previous_value)
            
    new_str = None
    if new_value is not None:
        if isinstance(new_value, (dict, list)):
            new_str = json.dumps(new_value, default=str)
        else:
            new_str = str(new_value)
            
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=str(entity_id),
        previous_value=prev_str,
        new_value=new_str,
        timestamp=datetime.utcnow(),
        reason=reason
    )
    db.add(audit_entry)
    # Does not commit immediately to allow enclosing transaction to commit atomically
    return audit_entry
