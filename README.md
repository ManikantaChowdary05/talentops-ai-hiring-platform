# TalentFlow 360 – Intelligent Recruitment Operations & Decision Intelligence Platform

> **Hackathon Submission for Yotta Flex**  
> *Deterministic Provenance Seed: `20261022`*  
> *Built with: React 18, TypeScript, Tailwind CSS, FastAPI, SQLAlchemy, Python 3.13, Pytest, Faker*

---

## 1. Executive Summary

**TalentFlow 360** is a complete, enterprise-grade recruitment operations and decision intelligence platform designed to eliminate hiring operational blindspots, guarantee recruitment governance, and deliver explainable AI decision intelligence from job requisition creation to final candidate onboarding.

Unlike standard ATS or prototype dashboards, TalentFlow 360 features:
- **Relational Integrity**: 18 normalized tables with foreign keys, range checks, and unique constraints.
- **Centralized Rules Engine (R001–R011)**: Strict policy evaluations returning explainable decisions (`PASS`, `BLOCK`, `REVIEW`).
- **Conflict-Free Scheduling**: Automated interviewer double-booking prevention with intelligent alternative slot suggestions.
- **Structured 5-Pillar Scorecards**: Standardized weighted scoring formula with reviewer disagreement detection.
- **Compensation Band Enforcement**: Requisition salary band compliance with automated Level 2 executive escalation.
- **Continuous Exception Center**: Real-time detection and guided remediation for the 5 mandatory recruitment anomalies.
- **Deterministic Synthetic Generation**: Reproducible baseline data generator across Starter, Demo, and Full datasets with fixed seed `20261022`.
- **Explainable AI & LLM Copilot**: Dual-engine intelligence (Google Gemini 1.5 Flash + Neural Heuristic fallback) for candidate-job matching, scorecard synthesis, and conversational recruitment assistance.
- **Immutable Audit Trail**: Append-only audit logging recording actors, entities, diffs, timestamps, and justifications.

---

## 2. Solved Business Problems

| Problem in Recruitment Operations | How TalentFlow 360 Solves It |
|---|---|
| **1. Unapproved requisitions entering pipeline** | **Rule R001** strictly blocks application submission unless requisition status is `Approved` or `Open`. |
| **2. Candidates advancing without reviews** | **Rule R003** prohibits stage skipping and requires verified scorecards before advancing to Offer. |
| **3. Poor candidate-stage visibility** | Real-time Kanban board & table tracking candidate progression with sequential history. |
| **4. Interviewer scheduling conflicts** | **Rule R006** blocks concurrent interviewer double-bookings and suggests verified open slots. |
| **5. Inconsistent / biased evaluations** | **Rule R007 & R008** enforce a 5-pillar rubric ($1-5$ scale), weighted formulas, and anti-bias checks. |
| **6. Offers exceeding compensation bands** | **Rule R009** detects salary overruns, routing offers to Level 2 Executive Exception Approval. |
| **7. Missing approval history** | Multi-level approval records preserving full decision history, timestamps, and comments. |
| **8. Lack of recruitment performance metrics** | Dynamic calculation of 15+ KPIs directly from live database tables (never hardcoded). |
| **9. Inability to identify operational anomalies** | Continuous scanning detecting 5 mandatory anomalies + extra process deviations. |
| **10. Lack of traceability for hiring decisions** | Append-only `AuditLog` and `ApplicationStageHistory` capturing complete state diffs. |

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Vite
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn
- **Database**: PostgreSQL / SQLite (with strict `PRAGMA foreign_keys = ON` relational enforcement)
- **Data Engineering**: Faker (Seed `20261022`), Pandas, NumPy
- **Testing**: Pytest, FastAPI TestClient, Relational Integrity & Fixed-Seed Reproducibility Suite
- **AI & Decision Intelligence**: Google Gemini 1.5 Flash API connector + Built-in Neural Heuristic Reasoning Engine

---

## 4. Synthetic Accounts & Demo Credentials

Use any of the following pre-configured persona accounts to test role-based access control (RBAC):

| Role | Username | Password | User Persona | Department |
|---|---|---|---|---|
| **System Administrator** | `admin` | `DemoPassword123!` | System Administrator | Executive |
| **HR Partner** | `hr_lead` | `DemoPassword123!` | Sarah Jenkins | HR & Operations |
| **HR Specialist** | `hr_specialist` | `DemoPassword123!` | Michael Chang | HR & Operations |
| **Hiring Manager** | `mgr_engineering` | `DemoPassword123!` | Elena Rostova | Engineering |
| **Hiring Manager** | `mgr_data` | `DemoPassword123!` | David Patel | Data & AI |
| **Interviewer** | `interviewer_tech1` | `DemoPassword123!` | Alex Thorne | Engineering |
| **Interviewer** | `interviewer_tech2` | `DemoPassword123!` | Priya Sharma | Engineering |
| **IT / Operations Partner**| `ops_lead` | `DemoPassword123!` | Jordan Reed | IT & Ops |
| **Employee / Candidate** | `cand_user` | `DemoPassword123!` | Demo Candidate | Engineering |

> *Tip: You can seamlessly switch between roles using the "Persona Role" dropdown in the top header.*

---

## 5. Quick Start Instructions

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ (Tested on Node.js v22)
- Git

### 1. Backend Setup
```bash
# From workspace root
pip install -r requirements.txt

# Seed the database with the Demo dataset (Seed 20261022)
python seed.py --mode demo

# Only for a disposable database: explicitly drop and recreate all tables
# python seed.py --mode demo --reset

# Start the FastAPI backend server (port 8000)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
# In a separate terminal
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Verification and Automated Testing

Run the automated test suite covering all positive and negative business rules, lifecycle stages, conflict prevention, weighted scorecards, and fixed-seed determinism:

```bash
# Run pytest test suite
python -m pytest backend/tests
```

**Test reporting:** Run the command above in the current checkout to obtain the authoritative result for your environment. The repository does not treat a previously recorded test count as proof that the current commit passes.

The reproducibility test generates two independent starter datasets and compares entity counts, ground-truth labels, and SHA-256 checksums of every generated table. Interview conflict validation calculates overlapping time windows for shared panel members rather than trusting a test marker. The generator creates baseline interviews only in slots present in every panel member's availability calendar; labelled anomaly fixtures are injected afterward.

---

## 7. Automated 13-Check Data Quality & Integrity Report

The platform includes an automated validation engine verifying:
1. **Primary-Key Uniqueness**: Zero collisions across all entities.
2. **Foreign-Key Integrity**: Zero orphaned relationships.
3. **Allowed Enumerations**: Valid status and stage enums.
4. **Temporal Ordering**: Non-negative date and salary ranges.
5. **Salary-Band Compliance (R009)**: Verifies detected compensation exceptions.
6. **Interview Conflict Validation (R006)**: Validates non-overlapping calendar protections.
7. **Application Lifecycle (R004)**: Ensures withdrawn candidates have no active bookings.
8. **Scorecard Completeness (R007)**: Checks that all 5 dimensions are rated $1-5$.
9. **Weighted Score Calculation**: $\text{SUM}(\text{score} \times \text{weight}) / 5 \times 100$.
10. **Approval Consistency (R011)**: Verifies that accepted offers hold approved decisions.
11. **Duplicate Detection**: Validates zero duplicate candidate emails.
12. **Fixed-Seed Determinism**: Confirms reproducible generation state.

Exported validation reports:
- [validation_summary.json](file:///C:/CandidateWorkspace/validation/validation_summary.json)
- [validation_report.md](file:///C:/CandidateWorkspace/validation/validation_report.md)
- [data_quality_report.csv](file:///C:/CandidateWorkspace/validation/data_quality_report.csv)
- [ground_truth.csv](file:///C:/CandidateWorkspace/validation/ground_truth.csv)
- [ground_truth.json](file:///C:/CandidateWorkspace/validation/ground_truth.json)

---

## 8. Business Rules Reference (R001 – R011)

- **R001**: Unapproved requisitions cannot receive valid applications.
- **R002**: Candidates must satisfy mandatory eligibility criteria.
- **R003**: Candidates cannot advance without required stage reviews.
- **R004**: Withdrawn candidates cannot progress.
- **R005**: Interview scheduling requires interviewer availability.
- **R006**: Confirmed interviewers cannot have overlapping interviews (anti-double booking).
- **R007**: Scorecards must be complete before final evaluation.
- **R008**: Irrelevant evaluation criteria must be flagged.
- **R009**: Offers exceeding compensation bands require exception approval.
- **R010**: Rejected offers cannot be marked as accepted.
- **R011**: Final hiring requires all mandatory approvals.

---

## 9. Explainable AI & LLM Decision Copilot

TalentFlow 360 incorporates native LLM intelligence:
1. **AI Candidate-Job Fit Matcher**: Evaluates candidate experience and skills against requisition requirements, generating an AI fit score ($0-100\%$), matching evidence, strengths, gaps, and suggested interview questions.
2. **Scorecard Narrative Summarization & Disagreement Resolver**: Identifies variance across multi-reviewer panels ($\ge 15$ points), highlights divergence, and synthesizes a committee consensus.
3. **Anomaly Diagnosis & Step-by-Step Remediation**: Explains the root cause, business risk, and resolution steps for any detected operational anomaly.
4. **Interactive Natural Language Copilot**: In-app assistant accessible from anywhere on the platform to answer policy questions, search candidates, and explain business decisions.

---

## 10. Repository Structure

```
CandidateWorkspace/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Routers (auth, reqs, cands, apps, ints, evals, offers, exc, audit)
│   │   ├── core/            # Config, DB, Security (JWT/RBAC), Rules Engine, Audit, LLM Engine
│   │   ├── models/          # 18 Normalized SQLAlchemy Entities
│   │   ├── schemas/         # Pydantic Schemas with model_validate
│   │   ├── services/        # Analytics Service (dynamic KPI calculation)
│   │   └── main.py          # FastAPI Application
│   ├── synthetic/           # Generator (Seed 20261022), Ground Truth Exporter, 12-Check Validator
│   └── tests/               # Pytest Suite (test_rules, test_reproducibility, test_api)
├── frontend/
│   ├── src/
│   │   ├── api/             # API Client
│   │   ├── components/      # 12 Navigation Modules + AI Copilot
│   │   ├── types/           # TypeScript Definitions
│   │   ├── App.tsx          # Master App Layout
│   │   └── main.tsx
│   ├── package.json
│   └── tailwind.config.js
├── docs/
│   ├── architecture.md      # System Architecture & Diagrams
│   ├── ER_diagram.md        # Mermaid ER Diagram & Cardinalities
│   ├── business_rules.md    # Detailed R001-R011 Specifications
│   ├── data_dictionary.md   # Schema Data Dictionary
│   ├── synthetic_data_documentation.md
│   └── api_documentation.md # OpenAPI / REST Endpoints
├── validation/              # Ground Truth (CSV/JSON) & Automated Validation Reports
├── schema.sql               # PostgreSQL / SQL Relational DDL
├── seed.py                  # CLI Synthetic Data Generator
├── requirements.txt
├── docker-compose.yml
└── README.md
```
