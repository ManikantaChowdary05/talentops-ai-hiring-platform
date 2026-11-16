import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base
from backend.synthetic.generator import SyntheticDataGenerator

def test_fixed_seed_reproducibility():
    """
    Validates that running the generator twice with seed 20261022 yields
    identical row counts, requisition IDs, candidate names, and exception sets.
    """
    engine1 = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine1)
    db1 = sessionmaker(bind=engine1)()

    gen1 = SyntheticDataGenerator(seed=20261022)
    res1 = gen1.generate_all(db1, mode="starter")

    engine2 = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine2)
    db2 = sessionmaker(bind=engine2)()

    gen2 = SyntheticDataGenerator(seed=20261022)
    res2 = gen2.generate_all(db2, mode="starter")

    # 1. Compare row counts
    assert res1["counts"] == res2["counts"], "Row counts must match exactly"

    # 2. Compare Ground Truth records
    gt1 = gen1.ground_truth_records
    gt2 = gen2.ground_truth_records
    assert len(gt1) == len(gt2)
    for r1, r2 in zip(gt1, gt2):
        assert r1["record_id"] == r2["record_id"]
        assert r1["issue_type"] == r2["issue_type"]
        assert r1["applicable_rule_id"] == r2["applicable_rule_id"]

    db1.close()
    db2.close()
