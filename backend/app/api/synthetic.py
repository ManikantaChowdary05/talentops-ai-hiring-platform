from typing import Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db, Base, engine
from backend.app.core.rules_engine import rules_engine
from backend.synthetic.generator import generator
from backend.synthetic.ground_truth import export_ground_truth
from backend.synthetic.validator import DataQualityValidator

router = APIRouter(prefix="/synthetic", tags=["Synthetic Data & Quality Validation"])

@router.post("/generate")
def generate_synthetic_data(
    mode: str = Query("demo", regex="^(starter|demo|full)$"),
    db: Session = Depends(get_db)
):
    """
    Rebuilds database with deterministic synthetic data at specified mode.
    Modes:
      - starter: 10 reqs, 250 cand, 400 apps, 100 ints
      - demo: 50 reqs, 1250 cand, 2000 apps, 500 ints
      - full: 200 reqs, 5000 cand, 8000 apps, 2000 ints
    """
    # Re-create tables cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    summary = generator.generate_all(db, mode=mode)
    
    # Export ground truth strictly separated from operational features
    csv_path, json_path = export_ground_truth(generator.ground_truth_records)
    summary["ground_truth_csv"] = csv_path
    summary["ground_truth_json"] = json_path

    # Run automated validation
    validator = DataQualityValidator(db)
    val_summary = validator.validate_all()
    summary["validation_score"] = val_summary["overall_integrity_score"]

    return summary

@router.get("/validate")
def run_data_validation(db: Session = Depends(get_db)):
    """
    Executes all 12 automated data quality & business-rule integrity checks.
    """
    validator = DataQualityValidator(db)
    report = validator.validate_all()
    return report

@router.get("/rules-config")
def get_rules_configuration():
    """
    Returns current configurable thresholds for rules R001 through R011.
    """
    return rules_engine.config

@router.post("/rules-config")
def update_rules_configuration(config_updates: Dict[str, Any]):
    """
    Allows administrators to configure thresholds without code modification.
    """
    for k, v in config_updates.items():
        rules_engine.update_config(k, v)
    return {"message": "Configuration updated successfully", "current_config": rules_engine.config}
