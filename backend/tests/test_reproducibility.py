import hashlib
import json
from sqlalchemy import select
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base
from backend.synthetic.generator import SyntheticDataGenerator


def _database_checksum(session):
    """Hash all table contents in deterministic order."""
    digest = hashlib.sha256()
    for table in Base.metadata.sorted_tables:
        rows = session.execute(select(table)).mappings().all()
        normalized = [
            {key: (value.isoformat() if hasattr(value, "isoformat") else value)
             for key, value in row.items()}
            for row in rows
        ]
        normalized.sort(key=lambda row: json.dumps(row, sort_keys=True, default=str))
        digest.update(table.name.encode("utf-8"))
        digest.update(json.dumps(normalized, sort_keys=True, default=str).encode("utf-8"))
    return digest.hexdigest()


def test_fixed_seed_reproducibility():
    """Independent runs with the same seed must produce identical DB checksums."""
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

    assert res1["counts"] == res2["counts"]
    assert gen1.ground_truth_records == gen2.ground_truth_records
    assert _database_checksum(db1) == _database_checksum(db2)

    db1.close()
    db2.close()
    engine1.dispose()
    engine2.dispose()
