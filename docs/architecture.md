# TalentFlow 360 – System Architecture Document

## 1. Executive Overview
**TalentFlow 360** is an enterprise-grade recruitment operations and decision intelligence platform engineered for hackathon evaluation at Yotta Flex. It integrates a relational transactional database, continuous recruitment business rules engine (R001–R011), deterministic synthetic data generation, structured 5-pillar evaluations, compensation band exception workflows, immutable audit trails, and an explainable AI decision copilot.

```
+-----------------------------------------------------------------------------------+
|                            TalentFlow 360 Frontend                                |
|  React 18 + TypeScript + Tailwind CSS + Recharts + Lucide Icons + Vite            |
+-----------------------------------------------------------------------------------+
                                        |  REST APIs / JSON / JWT
                                        v
+-----------------------------------------------------------------------------------+
|                         FastAPI Backend Application                               |
|  - Auth & RBAC (6 Personas)                - Interview Conflict Engine            |
|  - Requisition Lifecycle Manager           - 5-Pillar Scorecard Processor         |
|  - Rules Engine (R001 - R011)              - Multi-Level Offer Approvals          |
|  - Immutable Audit Logger                  - Continuous Exception Detector        |
+-----------------------------------------------------------------------------------+
             |                                                  |
             v                                                  v
+-----------------------------+               +-------------------------------------+
|    Relational Database      |               |     Explainable AI & LLM Engine     |
| - SQLite / PostgreSQL       |               | - Google Gemini 1.5 Flash Connector |
| - 18 Normalized Entities    |               | - Neural Heuristic Fallback Engine  |
| - Foreign Key Enforcement   |               | - Candidate Fit Analyzer            |
| - Append-Only Audit History |               | - Disagreement Resolver             |
+-----------------------------+               | - Anomaly Remediation Assistant     |
                                              +-------------------------------------+
```

## 2. Core Architectural Pillars

### A. Centralized Business Rules Engine (Rules R001 – R011)
All business decisions throughout the candidate lifecycle are governed by a deterministic, explainable rules engine returning:
- **Rule ID**: `R001` through `R011`
- **Decision**: `PASS`, `BLOCK`, or `REVIEW`
- **Explanation**: Human-readable policy rationale
- **Expected Action**: State-machine action instruction
- **Entity ID**: Subject record key
- **Timestamp**: ISO-8601 UTC timestamp

Rules are decoupled from application controller logic and configurable via `rules_engine.config` without code deployment.

### B. Anti-Conflict Scheduling Engine
Prevents double-booking across panel members:
- Analyzes existing confirmed bookings across all panel members.
- If overlapping interviewers are detected, the booking is rejected, conflicting participants are identified, available open slots are suggested, and failed attempts are recorded in exception logs.
- Includes a dedicated `test_mode_conflict` toggle for labeled historical demonstration scenarios without weakening production safeguards.

### C. 5-Pillar Structured Evaluation Framework
Evaluates candidate competency across 5 standardized dimensions:
1. Technical Knowledge: 30%
2. Problem Solving: 25%
3. Communication: 15%
4. Role-Specific Skills: 20%
5. Collaboration: 10%

**Mathematical Percentage Formula:**
$$\text{Weighted Score} = \frac{\sum (\text{criterion\_score} \times \text{criterion\_weight})}{5} \times 100$$

- **80.0 – 100.0%**: Strong Recommendation
- **65.0 – 79.9%**: Further Review
- **Below 65.0%**: Does Not Meet Evaluation Threshold

### D. Multi-Level Offer & Compensation Band Compliance
- **Within Requisition Band**: Direct Level 1 Hiring Manager approval.
- **Above Maximum Band**: Trigger Rule `R009`, routing offer to Level 2 Executive HR for compensation exception approval.
- **Rejected Offers**: Strictly blocked from transitioning to accepted without a revised offer version (preserving version history).
- **Final Hires**: Enforces Rule `R011`, guaranteeing all required approvals are satisfied before moving candidate to `Hired`.

### E. Immutable Audit Trail & Traceability
State mutations to Requisitions, Applications, Interviews, Scorecards, Offers, and Exceptions are recorded in an append-only `AuditLog` table capturing:
- `user_id` / actor
- `action` (CREATE, UPDATE, TRANSITION, APPROVE, REJECT, SCHEDULE)
- `entity` & `entity_id`
- `previous_value` & `new_value` (JSON serialized diff)
- `timestamp`
- `reason`

### F. Dual-Engine LLM & Decision Intelligence
- **Google Gemini 1.5 Flash Integration**: Native generative reasoning when `GEMINI_API_KEY` is present.
- **Enterprise Neural Fallback Engine**: 100% self-contained, deterministic NLP reasoning engine that analyzes skill overlap evidence, calculates fit scores (0–100%), resolves reviewer disagreements, drafts targeted interview questions, and provides step-by-step remediation plans for operational anomalies.
