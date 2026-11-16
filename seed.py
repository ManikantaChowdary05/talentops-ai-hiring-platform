import argparse
from backend.app.core.database import SessionLocal, Base, engine
from backend.synthetic.generator import generator
from backend.synthetic.ground_truth import export_ground_truth
from backend.synthetic.validator import DataQualityValidator
from backend.app.models.entities import User

def run_seed(mode: str = "demo", reset: bool = False):
    print(f"==================================================")
    print(f"TalentFlow 360 – Synthetic Seed Pipeline: {mode.upper()}")
    print(f"Seed: {generator.seed}")
    print(f"==================================================")

    # Normal seeding is non-destructive. Destructive reset is opt-in.
    Base.metadata.create_all(bind=engine)
    if reset:
        print("WARNING: --reset requested; dropping all existing tables.")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if not reset and db.query(User).count() > 0:
            raise RuntimeError(
                "Database already contains TalentFlow data. No changes were made. "
                "Use --reset only with a disposable database to replace its contents."
            )
        summary = generator.generate_all(db, mode=mode)
        print("Data generation complete! Entity counts:")
        for k, v in summary["counts"].items():
            print(f"  - {k}: {v}")

        # Ground truth
        csv_p, json_p = export_ground_truth(generator.ground_truth_records)
        print(f"Ground Truth exported: {csv_p}, {json_p}")

        # Quality validation
        print("Executing automated 12-rule validation...")
        validator = DataQualityValidator(db)
        val = validator.validate_all()
        print(f"Integrity Score: {val['overall_integrity_score']}% ({val['passed_checks']}/{val['total_checks']} checks passed, {val['anomalies_flagged']} anomalies verified)")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TalentFlow 360 Deterministic Synthetic Data Pipeline")
    parser.add_argument("--mode", type=str, default="demo", choices=["starter", "demo", "full"])
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Destructively drop and recreate all tables before seeding."
    )
    args = parser.parse_args()
    run_seed(args.mode, reset=args.reset)
