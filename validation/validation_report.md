# TalentFlow 360 – Automated Data Quality & Validation Report

**Execution Timestamp:** 2026-11-16T09:24:16.910070

**Overall Integrity Score:** 100.0%

**Total Checks Executed:** 14 | **Passed:** 9 | **Anomalies Flagged:** 5

**Injected Anomaly Detection:** detected 15 of 15 injected

## Validation Checks Detail

| Check Name | Category | Status | Records Evaluated | Violations / Flags | Details |
|------------|----------|--------|-------------------|--------------------|---------|
| Primary-Key Uniqueness | Schema Integrity | ✅ PASS | 676 | 0 | Evaluated 676 entity IDs across Users, Requisitions, Candidates, and Applications. |
| Foreign-Key Integrity | Relational Integrity | ✅ PASS | 400 | 0 | Zero orphaned application foreign keys detected across 400 records. |
| Allowed Enumeration Values | Domain Constraints | ✅ PASS | 410 | 0 | All requisition statuses and candidate stages comply strictly with enumerated domain models. |
| Date and Range Ordering | Temporal Logic | ✅ PASS | 110 | 0 | Checked range constraints on salaries, experiences, and interview timelines across 110 records. |
| Salary-Band Validation (R009) | Business Rule Compliance | ⚠️ ANOMALY | 61 | 1 | Identified 1 offers exceeding requisition maximum band (Labelled Anomaly R009). |
| Interview Conflict Validation (R006) | Scheduling Protections | ⚠️ ANOMALY | 100 | 2 | Conflict inspector detected 2 labelled test conflicts out of 100 scheduled interviews. |
| Application Lifecycle Validation (R004) | Workflow Integrity | ⚠️ ANOMALY | 100 | 2 | Detected 2 active interviews belonging to Withdrawn candidates (Labelled Anomaly R004). |
| Required Review Before Offer (R003) | Workflow Integrity | ⚠️ ANOMALY | 44 | 8 | Detected 8 applications advanced to Offer without an Offer stage-history review. |
| Evaluation Criteria Relevance (R008) | Evaluation Quality | ⚠️ ANOMALY | 105 | 2 | Detected 2 scorecards containing criteria outside the approved rubric. |
| Scorecard Completeness (R007) | Evaluation Quality | ✅ PASS | 105 | 0 | Validated completeness across 105 evaluation scorecards; all 5 dimensions scored 1-5. |
| Weighted Score Calculation (R007 Formula) | Mathematical Precision | ✅ PASS | 105 | 0 | Verified weighted score formula SUM(crit*weight)/5*100 across 105 scorecards. |
| Approval Consistency (R011) | Governance Compliance | ✅ PASS | 61 | 0 | Verified all accepted offers have corresponding approved signatures. |
| Duplicate Record Detection | Deduplication | ✅ PASS | 250 | 0 | Evaluated 250 candidate emails with zero duplicates detected. |
| Fixed-Seed Reproducibility | Determinism | ✅ PASS | 1 | 0 | Deterministic pseudo-random state verified against seed 20261022. |


---
*Generated automatically by TalentFlow 360 Validation Engine*
