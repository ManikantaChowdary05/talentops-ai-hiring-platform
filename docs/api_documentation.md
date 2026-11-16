# TalentFlow 360 – API Documentation (REST / OpenAPI)

Interactive Swagger / OpenAPI docs are available at `http://localhost:8000/docs` when the backend server is running.

## 1. Authentication & RBAC
- `POST /api/v1/auth/token`: Authenticate with username and password, returns JWT token.
- `GET /api/v1/auth/me`: Retrieve current user profile and role.
- `GET /api/v1/auth/roles-list`: Demo convenience endpoint listing available persona accounts.

## 2. Requisition Management
- `GET /api/v1/requisitions`: List requisitions with filters (`department`, `status`, `search`).
- `GET /api/v1/requisitions/{id}`: Detailed requisition with required skills and criteria.
- `POST /api/v1/requisitions`: Create new requisition (enforces salary_min $\le$ salary_max).
- `PATCH /api/v1/requisitions/{id}/approve`: Authorize requisition (Rule `R001`).

## 3. Candidate Management & AI Fit
- `GET /api/v1/candidates`: Search synthetic candidates by name, email, skills, and experience.
- `GET /api/v1/candidates/{id}`: Full candidate profile with skills and proficiencies.
- `POST /api/v1/candidates`: Register candidate profile.
- `GET /api/v1/candidates/{id}/ai-fit/{req_id}`: AI-driven suitability analysis with fit score (0–100%), skill evidence, and talking points.

## 4. Application Tracking
- `GET /api/v1/applications`: List applications by stage, requisition, candidate, or search.
- `GET /api/v1/applications/{id}`: Detailed application status.
- `GET /api/v1/applications/{id}/history`: Immutable sequential stage history trail.
- `POST /api/v1/applications`: Submit application (Rule `R001`).
- `POST /api/v1/applications/{id}/transition`: Advance stage (enforces Rules `R003`, `R004`, `R007`).

## 5. Interview Scheduling & Conflict Inspector
- `GET /api/v1/interviews`: Retrieve interview sessions.
- `GET /api/v1/interviews/panels`: List review panels and assigned members.
- `GET /api/v1/interviews/availabilities`: List open availability slots.
- `POST /api/v1/interviews`: Book interview (enforces Rules `R005`, `R006` non-overlapping constraints).
- `PATCH /api/v1/interviews/{id}/cancel`: Cancel booking and release calendar slots.

## 6. Structured Evaluations & Scorecards
- `GET /api/v1/evaluations`: List submitted 5-pillar scorecards.
- `POST /api/v1/evaluations`: Submit scorecard (enforces Rules `R007` completeness and `R008` anti-bias).
- `GET /api/v1/evaluations/summary/{interview_id}`: AI multi-reviewer consensus synthesis and disagreement resolution.

## 7. Offer Management & Approvals
- `GET /api/v1/offers`: List compensation offers.
- `POST /api/v1/offers`: Generate offer (enforces Rule `R009` salary band compliance).
- `PATCH /api/v1/offers/{id}/status`: Transition offer status (enforces Rules `R010` and `R011`).
- `GET /api/v1/approvals`: View multi-level approval queue.
- `POST /api/v1/approvals/{id}/action`: Submit Approve / Reject decision with comments.

## 8. Exceptions & Governance
- `GET /api/v1/exceptions`: List detected anomalies by severity and status.
- `PATCH /api/v1/exceptions/{id}/resolve`: Document resolution or dismissal with mandatory reason.
- `GET /api/v1/exceptions/{id}/ai-diagnosis`: AI root cause analysis and remediation roadmap.

## 9. Analytics & Decision Intelligence
- `GET /api/v1/analytics/dashboard`: Live KPI metrics, conversion rates, and chart data calculated from database records.

## 10. Audit Trail
- `GET /api/v1/audit`: Query append-only audit events with entity and action filters.

## 11. AI Copilot
- `POST /api/v1/copilot/query`: Conversational decision intelligence interface.

## 12. Synthetic Pipeline & Settings
- `POST /api/v1/synthetic/generate`: Reseed database in `starter`, `demo`, or `full` mode.
- `GET /api/v1/synthetic/validate`: Run 12-check automated data quality validation.
- `GET /api/v1/synthetic/rules-config`: Retrieve configurable rule thresholds.
- `POST /api/v1/synthetic/rules-config`: Update rule thresholds dynamically.
