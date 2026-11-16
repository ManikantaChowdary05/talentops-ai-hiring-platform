import argparse
from backend.app.core.database import SessionLocal, Base, engine
from backend.synthetic.generator import generator
from backend.synthetic.ground_truth import export_ground_truth
from backend.synthetic.validator import DataQualityValidator

def run_seed(mode: str = "demo"):
    print(f"==================================================")
    print(f"TalentFlow 360 – Synthetic Seed Pipeline: {mode.upper()}")
    print(f"Seed: {generator.seed}")
    print(f"==================================================")

    # Clean and re-create schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
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
    args = parser.parse_args()
    run_seed(args.mode)
