from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token, get_current_user
from backend.app.models.entities import User
from backend.app.schemas.schemas import Token, LoginRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/roles-list")
def list_available_roles(db: Session = Depends(get_db)):
    """Convenience endpoint for hackathon demo to switch between synthetic roles"""
    users = db.query(User).all()
    return [{"username": u.username, "role": u.role, "full_name": u.full_name, "department": u.department} for u in users]
