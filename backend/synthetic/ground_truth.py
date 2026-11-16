import os
import csv
import json
from typing import List, Dict, Any

def export_ground_truth(records: List[Dict[str, Any]], output_dir: str = "validation"):
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "ground_truth.csv")
    json_path = os.path.join(output_dir, "ground_truth.json")

    # Export CSV
    fieldnames = [
        "record_id", "entity_type", "entity_id", "issue_type", 
        "expected_classification", "expected_decision", "applicable_rule_id", "scenario_description"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow(r)

    # Export JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    return csv_path, json_path
