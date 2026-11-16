# TalentFlow 360 – Synthetic Data Generation Documentation

## 1. Provenance & Reproducibility Parameters
- **Fixed Deterministic Seed**: `20261022`
- **Generator Version**: 1.0.0
- **Base Date Timeline**: 2026-01-10 through 2026-06-30
- **Random Number Generator**: Python `random.seed(20261022)` + Faker `Faker.seed(20261022)`

Identical seeds produce bit-for-bit identical row counts, identifiers, candidate names, and injected anomaly positions.

---

## 2. Dataset Modes

| Mode | Requisitions | Candidates | Applications | Interviews | Target Use Case |
|------|-------------:|-----------:|-------------:|-----------:|-----------------|
| **Starter** | 10 | 250 | 400 | 100 | Unit testing, rapid automated CI/CD |
| **Demo** | 50 | 1,250 | 2,000 | 500 | Interactive judge demonstrations, executive review |
| **Full** | 200 | 5,000 | 8,000 | 2,000 | High-volume stress testing & enterprise benchmark |

---

## 3. Ordered Generation Lifecycle
To guarantee relational referential integrity without orphan records, generation strictly follows this execution order:

1. **Users & Hiring Managers**: Generates 6 primary persona accounts with hashed credentials and department allocations.
2. **Requisitions & Skill Requirements**: Generates requisitions across 6 departments with role-tailored salary bands and minimum experience constraints.
3. **Candidates & Candidate Skills**: Generates candidate profiles with verified degree citations and 4–7 skills with proficiency levels (1–5).
4. **Applications & Stage History**: Generates applications (`APP-<candidate-id>-<req-id>`) ensuring compliance with Rule `R001` (open/approved requisitions only) and sequential stage history.
5. **Interview Panels & Panel Members**: Assembles technical review boards per requisition.
6. **Interviewer Availabilities**: Generates two weeks of non-overlapping hourly calendar slots.
7. **Interviews & Scorecards**: Books technical interviews and populates 5-pillar scorecards with weighted formula calculations.
8. **Offers & Approvals**: Generates offers within salary bands with designated level approvals.
9. **Audit Records**: Populates immutable audit events.
10. **Labelled Anomaly Injection**: Injects the 5 mandatory anomalies separately with separate Ground Truth exports.

---

## 4. Injected Labelled Anomalies & Ground Truth
Anomalies are injected cleanly into the baseline dataset to verify detection without corrupting operational pipeline stability:

1. **Candidate moves forward without required review (`R003`)**: Application advanced directly to Offer without completing mandatory technical scorecard reviews.
2. **Interviewer double-booked (`R006`)**: Simultaneous overlapping calendar bookings assigned to the same panel member.
3. **Offer exceeds approved compensation band (`R009`)**: Proposed salary set 40% above requisition maximum ceiling without Level 2 exception approval.
4. **Withdrawn candidate remains scheduled (`R004`)**: Application marked Withdrawn/Inactive while maintaining an active scheduled interview slot on the calendar.
5. **Evaluation includes irrelevant criteria (`R008`)**: Scorecard rubric submitted with extraneous non-job-related dimensions ('candidate personal hobbies and social background').

All anomalies are exported to `validation/ground_truth.csv` and `validation/ground_truth.json` and kept strictly segregated from operational decision features.
