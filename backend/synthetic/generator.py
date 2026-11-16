import os
import random
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
from faker import Faker
from sqlalchemy.orm import Session
from backend.app.models.entities import (
    User, HiringManager, Requisition, SkillRequirement,
    Candidate, CandidateSkill, Application, ApplicationStageHistory,
    InterviewPanel, PanelMember, Availability, Interview,
    Scorecard, Offer, Approval, AuditLog, ExceptionLog, Notification
)
from backend.app.core.rules_engine import rules_engine
from backend.app.core.security import hash_password

DEPARTMENTS = ["Engineering", "Product Management", "Data & AI", "Design", "DevOps & Cloud", "HR & Operations"]

JOB_ROLES = {
    "Engineering": [
        ("Full Stack Engineer", 2.0, 6.0, 75000, 130000, ["Python", "React", "TypeScript", "SQL", "Docker"]),
        ("Senior Backend Architect", 6.0, 12.0, 130000, 200000, ["Python", "PostgreSQL", "FastAPI", "Distributed Systems", "Kubernetes"]),
        ("Frontend Engineer", 1.0, 5.0, 65000, 115000, ["React", "TypeScript", "Tailwind CSS", "JavaScript", "HTML/CSS"])
    ],
    "Data & AI": [
        ("Machine Learning Engineer", 3.0, 8.0, 100000, 165000, ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Data Pipelines"]),
        ("Data Engineer", 2.0, 7.0, 85000, 140000, ["SQL", "Python", "ETL", "PostgreSQL", "Pandas"]),
        ("Decision Intelligence Analyst", 2.0, 6.0, 80000, 130000, ["SQL", "Tableau", "Statistical Modeling", "Python", "Data Visualization"])
    ],
    "Product Management": [
        ("Senior Technical Product Manager", 5.0, 10.0, 120000, 185000, ["Product Strategy", "Agile", "User Research", "Roadmapping", "SQL"]),
        ("Associate Product Manager", 1.0, 3.0, 70000, 100000, ["Product Discovery", "Wireframing", "Data Analysis", "Jira", "Communication"])
    ],
    "Design": [
        ("Lead Product Designer", 4.0, 9.0, 95000, 155000, ["Figma", "Design Systems", "User Research", "Prototyping", "UI/UX Architecture"])
    ],
    "DevOps & Cloud": [
        ("Site Reliability Engineer", 3.0, 8.0, 110000, 170000, ["Kubernetes", "Terraform", "CI/CD", "AWS", "Linux"])
    ],
    "HR & Operations": [
        ("Talent Operations Lead", 3.0, 7.0, 75000, 120000, ["Recruitment Analytics", "HRIS", "Stakeholder Management", "Talent Sourcing", "Interview Operations"])
    ]
}

LOCATIONS = ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Remote, US", "Chicago, IL"]

UNIVERSITIES = [
    "Stanford University", "MIT", "UC Berkeley", "Carnegie Mellon", 
    "Georgia Tech", "University of Washington", "University of Texas at Austin",
    "Columbia University", "University of Michigan", "UCLA"
]

DEGREES = ["B.S. in Computer Science", "M.S. in Software Engineering", "B.S. in Information Systems", "M.S. in Data Science", "B.A. in Human Computer Interaction"]

class SyntheticDataGenerator:
    def __init__(self, seed: int = 20261022):
        self.seed = seed
        self.faker = Faker()
        Faker.seed(seed)
        random.seed(seed)
        self.ground_truth_records: List[Dict[str, Any]] = []

    def get_targets(self, mode: str) -> Tuple[int, int, int, int]:
        modes = {
            "starter": (10, 250, 400, 100),
            "demo": (50, 1250, 2000, 500),
            "full": (200, 5000, 8000, 2000)
        }
        return modes.get(mode.lower(), modes["demo"])

    def generate_all(self, db: Session, mode: str = "demo") -> Dict[str, Any]:
        """
        Executes strict ordered synthetic data generation with reproducible seed.
        """
        Faker.seed(self.seed)
        random.seed(self.seed)
        self.ground_truth_records.clear()

        n_reqs, n_cands, n_apps, n_ints = self.get_targets(mode)
        
        # Base start date: 2026-01-01
        base_date = datetime(2026, 1, 10, 9, 0, 0)

        # 1. Generate Core System Users & Hiring Managers
        users, hiring_managers = self._generate_users_and_managers(db, base_date)
        
        # 2 & 3. Generate Requisitions & Skill Requirements
        requisitions, skill_reqs = self._generate_requisitions_and_skills(db, hiring_managers, n_reqs, base_date)
        
        # 4 & 5. Generate Candidates & Candidate Skills
        candidates, candidate_skills = self._generate_candidates_and_skills(db, n_cands, base_date)
        
        # 6 & 7. Generate Applications & Stage History
        applications, stage_histories = self._generate_applications_and_stages(db, candidates, requisitions, n_apps, base_date)
        
        # 8 & 9. Generate Interview Panels & Panel Members
        panels, panel_members = self._generate_panels(db, requisitions, users, base_date)
        
        # 10. Generate Interviewer Availabilities
        availabilities = self._generate_availabilities(db, users, base_date)
        
        # 11 & 12. Generate Interviews & Scorecards
        interviews, scorecards = self._generate_interviews_and_scorecards(db, applications, panels, users, n_ints, base_date)
        
        # 13 & 14. Generate Offers & Approvals
        offers, approvals = self._generate_offers_and_approvals(db, applications, users, hiring_managers, base_date)
        
        # 15. Generate Audit Records
        audit_records = self._generate_audit_records(db, users, requisitions, applications, offers, base_date)
        
        # 16. Inject Labelled Anomalies & Exceptions
        exceptions = self._inject_anomalies_and_exceptions(db, applications, interviews, offers, scorecards, users)
        
        db.commit()

        # Build summary
        summary = {
            "mode": mode,
            "seed": self.seed,
            "counts": {
                "users": len(users),
                "hiring_managers": len(hiring_managers),
                "requisitions": len(requisitions),
                "candidates": len(candidates),
                "applications": len(applications),
                "interviews": len(interviews),
                "scorecards": len(scorecards),
                "offers": len(offers),
                "approvals": len(approvals),
                "audit_logs": len(audit_records),
                "exceptions": len(exceptions),
                "ground_truth_records": len(self.ground_truth_records)
            }
        }
        return summary

    def _generate_users_and_managers(self, db: Session, base_date: datetime):
        users = []
        hiring_managers = []
        
        # Predefined demo accounts for every role
        role_definitions = [
            ("admin", "admin@talentflow360.io", "System Administrator", "Admin User", "Executive"),
            ("hr_lead", "hr.lead@talentflow360.io", "HR Partner", "Sarah Jenkins", "HR & Operations"),
            ("hr_specialist", "hr.specialist@talentflow360.io", "HR Partner", "Michael Chang", "HR & Operations"),
            ("mgr_engineering", "mgr.eng@talentflow360.io", "Hiring Manager", "Elena Rostova", "Engineering"),
            ("mgr_data", "mgr.data@talentflow360.io", "Hiring Manager", "David Patel", "Data & AI"),
            ("mgr_product", "mgr.pm@talentflow360.io", "Hiring Manager", "Rachel Miller", "Product Management"),
            ("interviewer_tech1", "tech1@talentflow360.io", "Interviewer", "Alex Thorne", "Engineering"),
            ("interviewer_tech2", "tech2@talentflow360.io", "Interviewer", "Priya Sharma", "Engineering"),
            ("interviewer_data", "data.int@talentflow360.io", "Interviewer", "Liam Vance", "Data & AI"),
            ("ops_lead", "ops@talentflow360.io", "IT / Operations Partner", "Jordan Reed", "IT & Ops"),
            ("cand_user", "cand@talentflow360.io", "Employee / Candidate", "Demo Candidate", "Engineering")
        ]

        for idx, (uname, email, role, full_name, dept) in enumerate(role_definitions, 1):
            uid = f"USR-{idx:06d}"
            user = User(
                user_id=uid,
                username=uname,
                email=email,
                password_hash=hash_password("DemoPassword123!"),
                full_name=full_name,
                role=role,
                department=dept,
                is_active=True,
                created_at=base_date
            )
            db.add(user)
            users.append(user)

            if role == "Hiring Manager":
                mgr_id = f"MGR-{len(hiring_managers)+1:06d}"
                hm = HiringManager(
                    manager_id=mgr_id,
                    user_id=uid,
                    department=dept,
                    title="Engineering Director" if dept == "Engineering" else f"Head of {dept}",
                    max_approval_level=2,
                    created_at=base_date
                )
                db.add(hm)
                hiring_managers.append(hm)

        # Generate additional synthetic interviewers & hiring managers
        extra_dept_roles = [
            ("Interviewer", "Engineering", "Senior Software Engineer"),
            ("Interviewer", "Data & AI", "Lead Data Scientist"),
            ("Hiring Manager", "Design", "Director of Design"),
            ("Hiring Manager", "DevOps & Cloud", "Head of Infrastructure"),
            ("Interviewer", "Engineering", "Staff Infrastructure Engineer")
        ]
        
        for idx_offset, (role, dept, title) in enumerate(extra_dept_roles, len(role_definitions)+1):
            uid = f"USR-{idx_offset:06d}"
            fname = self.faker.name()
            uname = f"user_{idx_offset}"
            email = f"user_{idx_offset}@talentflow360.io"
            user = User(
                user_id=uid,
                username=uname,
                email=email,
                password_hash=hash_password("DemoPassword123!"),
                full_name=fname,
                role=role,
                department=dept,
                is_active=True,
                created_at=base_date
            )
            db.add(user)
            users.append(user)

            if role == "Hiring Manager":
                mgr_id = f"MGR-{len(hiring_managers)+1:06d}"
                hm = HiringManager(
                    manager_id=mgr_id,
                    user_id=uid,
                    department=dept,
                    title=title,
                    max_approval_level=1,
                    created_at=base_date
                )
                db.add(hm)
                hiring_managers.append(hm)

        db.flush()
        return users, hiring_managers

    def _generate_requisitions_and_skills(self, db: Session, hiring_managers: List[HiringManager], n_reqs: int, base_date: datetime):
        requisitions = []
        all_skills = []

        statuses = ["Approved", "Open", "Open", "Open", "Pending Approval", "Draft", "On Hold", "Closed"]

        for i in range(1, n_reqs + 1):
            req_id = f"REQ-2026-{i:06d}"
            dept = random.choice(DEPARTMENTS)
            role_options = JOB_ROLES.get(dept, JOB_ROLES["Engineering"])
            role_tuple = random.choice(role_options)
            job_title, exp_min, exp_max, sal_min, sal_max, req_skills = role_tuple

            mgr = random.choice(hiring_managers)
            status = random.choice(statuses) if i > 5 else "Open"  # ensure first 5 are Open
            created_dt = base_date + timedelta(days=random.randint(1, 20))
            approved_dt = created_dt + timedelta(days=random.randint(1, 4)) if status in ["Approved", "Open", "Closed"] else None
            closing_dt = created_dt + timedelta(days=random.randint(60, 120))

            req = Requisition(
                requisition_id=req_id,
                job_title=job_title,
                department=dept,
                location=random.choice(LOCATIONS),
                hiring_manager_id=mgr.manager_id,
                employment_type="Full-time",
                experience_min=exp_min,
                experience_max=exp_max,
                salary_min=sal_min,
                salary_max=sal_max,
                positions_available=random.randint(1, 3),
                requisition_status=status,
                created_date=created_dt,
                approved_date=approved_dt,
                expected_closing_date=closing_dt
            )
            db.add(req)
            requisitions.append(req)

            # Skill requirements
            for s_idx, skill_name in enumerate(req_skills):
                is_mand = (s_idx < 3) # first 3 mandatory
                skill_req = SkillRequirement(
                    requisition_id=req_id,
                    skill_name=skill_name,
                    is_mandatory=is_mand,
                    min_proficiency=3 if is_mand else 2,
                    min_experience_years=exp_min * 0.7 if is_mand else 1.0
                )
                db.add(skill_req)
                all_skills.append(skill_req)

        db.flush()
        return requisitions, all_skills

    def _generate_candidates_and_skills(self, db: Session, n_cands: int, base_date: datetime):
        candidates = []
        candidate_skills = []

        top_tech_skills = [
            "Python", "React", "TypeScript", "SQL", "Docker", "PostgreSQL", 
            "FastAPI", "Kubernetes", "Distributed Systems", "AWS", "PyTorch", 
            "TensorFlow", "Pandas", "Scikit-Learn", "Agile", "Figma", "CI/CD"
        ]

        for i in range(1, n_cands + 1):
            cand_id = f"CAND-{i:06d}"
            fname = self.faker.name()
            email = f"candidate.{i}_{self.faker.user_name()}@example.com"
            phone = f"+1-{random.randint(200,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}"
            loc = random.choice(LOCATIONS)
            edu = f"{random.choice(DEGREES)}, {random.choice(UNIVERSITIES)}"
            exp_years = round(random.uniform(1.0, 15.0), 1)
            
            # Select 4-7 skills
            cand_skill_subset = random.sample(top_tech_skills, random.randint(4, 7))
            curr_role = f"Senior {cand_skill_subset[0]} Developer" if exp_years >= 5 else f"{cand_skill_subset[0]} Developer"
            expected_sal = round(random.uniform(70000, 190000) / 1000) * 1000

            cand = Candidate(
                candidate_id=cand_id,
                full_name=fname,
                email=email,
                phone=phone,
                location=loc,
                education=edu,
                experience_years=exp_years,
                current_role=curr_role,
                current_company=self.faker.company(),
                expected_salary=expected_sal,
                skills=", ".join(cand_skill_subset),
                profile_created_date=base_date + timedelta(days=random.randint(5, 30))
            )
            db.add(cand)
            candidates.append(cand)

            for s_name in cand_skill_subset:
                c_skill = CandidateSkill(
                    candidate_id=cand_id,
                    skill_name=s_name,
                    proficiency_level=random.randint(2, 5),
                    experience_years=round(random.uniform(0.5, exp_years), 1)
                )
                db.add(c_skill)
                candidate_skills.append(c_skill)

        db.flush()
        return candidates, candidate_skills

    def _generate_applications_and_stages(
        self, db: Session, candidates: List[Candidate], requisitions: List[Requisition], n_apps: int, base_date: datetime
    ):
        applications = []
        stage_histories = []
        
        # Only Open or Approved requisitions accept valid applications as per R001
        valid_reqs = [r for r in requisitions if r.requisition_status in ["Approved", "Open"]]
        if not valid_reqs:
            valid_reqs = requisitions

        app_pairs = set()
        
        # Stages lifecycle
        possible_stages = [
            "Applied", "Screening", "Assessment", "Technical Interview", 
            "Manager Interview", "Offer", "Hired", "Rejected", "Withdrawn"
        ]

        attempts = 0
        while len(applications) < n_apps and attempts < n_apps * 3:
            attempts += 1
            cand = random.choice(candidates)
            req = random.choice(valid_reqs)
            pair_key = (cand.candidate_id, req.requisition_id)
            if pair_key in app_pairs:
                continue
            app_pairs.add(pair_key)

            # Deterministic Application ID: APP-<candidate-id>-<req-id>
            app_id = f"APP-{cand.candidate_id}-{req.requisition_id}"
            
            # Weighted distribution of stages
            r_stage_val = random.random()
            if r_stage_val < 0.25:
                curr_stage = "Applied"
            elif r_stage_val < 0.45:
                curr_stage = "Screening"
            elif r_stage_val < 0.65:
                curr_stage = "Technical Interview"
            elif r_stage_val < 0.75:
                curr_stage = "Manager Interview"
            elif r_stage_val < 0.85:
                curr_stage = "Offer"
            elif r_stage_val < 0.92:
                curr_stage = "Hired"
            elif r_stage_val < 0.97:
                curr_stage = "Rejected"
            else:
                curr_stage = "Withdrawn"

            app_status = "Completed" if curr_stage in ["Hired", "Rejected", "Withdrawn"] else "Active"
            app_date = cand.profile_created_date + timedelta(days=random.randint(1, 10))

            app = Application(
                application_id=app_id,
                candidate_id=cand.candidate_id,
                requisition_id=req.requisition_id,
                current_stage=curr_stage,
                application_status=app_status,
                applied_date=app_date,
                updated_at=app_date + timedelta(days=random.randint(1, 15))
            )
            db.add(app)
            applications.append(app)

            # Generate realistic sequential stage history (never overwrite!)
            stages_path = ["Applied"]
            if curr_stage != "Applied":
                if curr_stage in ["Screening", "Assessment", "Technical Interview", "Manager Interview", "Offer", "Hired"]:
                    full_ladder = ["Applied", "Screening", "Assessment", "Technical Interview", "Manager Interview", "Offer", "Hired"]
                    target_idx = full_ladder.index(curr_stage)
                    stages_path = full_ladder[:target_idx + 1]
                elif curr_stage == "Rejected":
                    stages_path = ["Applied", "Screening", "Technical Interview", "Rejected"]
                elif curr_stage == "Withdrawn":
                    stages_path = ["Applied", "Screening", "Withdrawn"]

            step_time = app_date
            prev_s = None
            for s_name in stages_path:
                dec = "PASS" if s_name not in ["Rejected", "Withdrawn"] else ("REJECT" if s_name == "Rejected" else "WITHDRAW")
                rule_id = "R001" if s_name == "Applied" else ("R002" if s_name == "Screening" else "R003")
                
                sh = ApplicationStageHistory(
                    application_id=app_id,
                    previous_stage=prev_s,
                    new_stage=s_name,
                    decision=dec,
                    decision_reason=f"Transitioned to {s_name} in compliance with {rule_id}",
                    actor="HR System",
                    timestamp=step_time,
                    related_rule_id=rule_id
                )
                db.add(sh)
                stage_histories.append(sh)
                prev_s = s_name
                step_time += timedelta(days=random.randint(1, 5))

        db.flush()
        return applications, stage_histories

    def _generate_panels(self, db: Session, requisitions: List[Requisition], users: List[User], base_date: datetime):
        panels = []
        panel_members = []
        interviewers = [u for u in users if u.role in ["Interviewer", "Hiring Manager"]]
        
        for idx, req in enumerate(requisitions, 1):
            pnl_id = f"PNL-{idx:06d}"
            panel = InterviewPanel(
                panel_id=pnl_id,
                requisition_id=req.requisition_id,
                panel_name=f"{req.job_title} Review Board",
                description=f"Evaluation committee for {req.department}",
                created_at=base_date
            )
            db.add(panel)
            panels.append(panel)

            # Assign 2-3 panel members
            assigned_reviewers = random.sample(interviewers, min(3, len(interviewers)))
            for m_idx, rev in enumerate(assigned_reviewers):
                pm = PanelMember(
                    panel_id=pnl_id,
                    user_id=rev.user_id,
                    is_mandatory=True if m_idx == 0 else False,
                    role_in_panel="Lead Evaluator" if m_idx == 0 else "Technical Reviewer"
                )
                db.add(pm)
                panel_members.append(pm)

        db.flush()
        return panels, panel_members

    def _generate_availabilities(self, db: Session, users: List[User], base_date: datetime):
        availabilities = []
        interviewers = [u for u in users if u.role in ["Interviewer", "Hiring Manager"]]
        
        # 14 days of slots
        for day_offset in range(1, 20):
            current_day = (base_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            for u in interviewers:
                for slot_hour in [9, 11, 14, 16]:
                    start_str = f"{slot_hour:02d}:00"
                    end_str = f"{slot_hour+1:02d}:00"
                    av = Availability(
                        user_id=u.user_id,
                        date=current_day,
                        start_time=start_str,
                        end_time=end_str,
                        is_booked=False
                    )
                    db.add(av)
                    availabilities.append(av)

        db.flush()
        return availabilities

    def _generate_interviews_and_scorecards(
        self, db: Session, applications: List[Application], panels: List[InterviewPanel], 
        users: List[User], n_ints: int, base_date: datetime
    ):
        interviews = []
        scorecards = []
        panel_map = {p.requisition_id: p for p in panels}

        # Filter candidates eligible for interviews
        interview_apps = [
            a for a in applications 
            if a.current_stage in ["Technical Interview", "Manager Interview", "Offer", "Hired"]
        ]
        if not interview_apps:
            interview_apps = applications[:n_ints]

        app_selection = random.sample(interview_apps, min(n_ints, len(interview_apps)))

        for idx, app in enumerate(app_selection, 1):
            int_id = f"INT-2026-{idx:06d}"
            panel = panel_map.get(app.requisition_id, panels[0])
            
            # Allocate a conflict-free slot for every member of the panel.
            int_start = None
            for day_offset in range(10, 110):
                for start_hour in [9, 11, 14, 16]:
                    candidate_start = base_date + timedelta(days=day_offset, hours=start_hour)
                    candidate_end = candidate_start + timedelta(hours=1)
                    overlaps = any(
                        existing.status != "Cancelled"
                        and existing.panel
                        and set(member.user_id for member in panel.members).intersection(
                            member.user_id for member in existing.panel.members
                        )
                        and candidate_start < existing.scheduled_end
                        and candidate_end > existing.scheduled_start
                        for existing in interviews
                    )
                    if not overlaps:
                        int_start = candidate_start
                        break
                if int_start is not None:
                    break
            if int_start is None:
                raise RuntimeError("Unable to allocate a conflict-free interview slot")
            int_end = int_start + timedelta(hours=1)
            
            status = "Completed" if app.current_stage in ["Offer", "Hired"] else "Scheduled"

            interview = Interview(
                interview_id=int_id,
                application_id=app.application_id,
                panel_id=panel.panel_id,
                interview_type="Technical Interview" if "Technical" in app.current_stage else "Executive Review",
                scheduled_start=int_start,
                scheduled_end=int_end,
                status=status,
                calendar_notes="Standard technical rubric session",
                test_mode_conflict=False,
                created_at=int_start - timedelta(days=3)
            )
            db.add(interview)
            interviews.append(interview)

            # Generate structured scorecards for completed interviews
            if status == "Completed":
                # Get reviewers from panel
                reviewers = [m.user_id for m in panel.members]
                for r_id in reviewers:
                    sc_id = f"SCORE-{int_id}-{r_id}"
                    tech = random.choice([3.5, 4.0, 4.5, 5.0])
                    prob = random.choice([3.0, 4.0, 4.5, 5.0])
                    comm = random.choice([3.5, 4.0, 4.5, 5.0])
                    role = random.choice([3.0, 4.0, 4.5, 5.0])
                    collab = random.choice([3.5, 4.0, 4.5, 5.0])

                    final_score, rec = rules_engine.calculate_scorecard_weighted_score(
                        tech, prob, comm, role, collab
                    )

                    sc = Scorecard(
                        scorecard_id=sc_id,
                        interview_id=int_id,
                        reviewer_id=r_id,
                        technical_knowledge=tech,
                        problem_solving=prob,
                        communication=comm,
                        role_specific_skills=role,
                        collaboration=collab,
                        weighted_score=final_score,
                        recommendation=rec,
                        feedback_comments="Strong analytical capabilities, clear communication, and solid problem decomposition.",
                        rubric_version="1.0",
                        is_complete=True,
                        has_disagreement=False,
                        submitted_at=int_end + timedelta(minutes=random.randint(15, 120))
                    )
                    db.add(sc)
                    scorecards.append(sc)

        db.flush()
        return interviews, scorecards

    def _generate_offers_and_approvals(
        self, db: Session, applications: List[Application], users: List[User], 
        hiring_managers: List[HiringManager], base_date: datetime
    ):
        offers = []
        approvals = []
        hr_users = [u for u in users if u.role == "HR Partner"]
        hr_creator = hr_users[0].user_id if hr_users else users[0].user_id
        
        offer_apps = [a for a in applications if a.current_stage in ["Offer", "Hired"]]

        for idx, app in enumerate(offer_apps, 1):
            off_id = f"OFF-2026-{idx:06d}"
            req = app.requisition
            
            # 85% within band, baseline
            sal_target = (req.salary_min + req.salary_max) / 2.0
            proposed_sal = round(sal_target / 1000) * 1000
            
            status = "Accepted" if app.current_stage == "Hired" else "Approved"

            offer = Offer(
                offer_id=off_id,
                application_id=app.application_id,
                proposed_salary=proposed_sal,
                currency="USD",
                bonus=round(proposed_sal * 0.10),
                joining_date=base_date + timedelta(days=60 + idx),
                offer_status=status,
                version=1,
                created_by=hr_creator,
                created_at=base_date + timedelta(days=35 + idx),
                band_compliance_status="Within Band"
            )
            db.add(offer)
            offers.append(offer)

            # Approvals
            appr_id = f"APPV-2026-{idx:06d}"
            mgr_user_id = req.hiring_manager.user_id if req.hiring_manager else users[0].user_id
            appr = Approval(
                approval_id=appr_id,
                offer_id=off_id,
                approver_id=mgr_user_id,
                approval_level=1,
                decision="Approved",
                comments="Approved within standard hiring budget.",
                timestamp=offer.created_at + timedelta(days=1)
            )
            db.add(appr)
            approvals.append(appr)

        db.flush()
        return offers, approvals

    def _generate_audit_records(
        self, db: Session, users: List[User], requisitions: List[Requisition],
        applications: List[Application], offers: List[Offer], base_date: datetime
    ):
        audit_logs = []
        admin_user = users[0].user_id

        # Audit initial requisition creations
        for req in requisitions[:15]:
            al = AuditLog(
                user_id=admin_user,
                action="CREATE",
                entity="Requisition",
                entity_id=req.requisition_id,
                previous_value=None,
                new_value=json.dumps({"title": req.job_title, "status": req.requisition_status, "salary": [req.salary_min, req.salary_max]}),
                timestamp=req.created_date,
                reason="Requisition initial creation and authorization"
            )
            db.add(al)
            audit_logs.append(al)

        # Audit offer generation
        for off in offers[:10]:
            al = AuditLog(
                user_id=off.created_by,
                action="CREATE",
                entity="Offer",
                entity_id=off.offer_id,
                previous_value=None,
                new_value=json.dumps({"proposed_salary": off.proposed_salary, "bonus": off.bonus, "status": off.offer_status}),
                timestamp=off.created_at,
                reason="Formal offer generation within compensation band"
            )
            db.add(al)
            audit_logs.append(al)

        db.flush()
        return audit_logs

    def _inject_anomalies_and_exceptions(
        self, db: Session, applications: List[Application], interviews: List[Interview],
        offers: List[Offer], scorecards: List[Scorecard], users: List[User]
    ) -> List[ExceptionLog]:
        """
        Injects the 5 mandatory anomalies + extra operational anomalies cleanly,
        recording both ExceptionLog entries and Ground Truth records.
        """
        exceptions = []
        exc_counter = 1

        # Anomaly 1: Candidate moves forward without required review (R003)
        if len(applications) > 5:
            target_app = applications[1]
            old_stage = target_app.current_stage
            target_app.current_stage = "Offer"  # deliberately injected R003 violation
            target_app.updated_at = datetime(2026, 2, 1, 12, 0, 0)
            db.add(ApplicationStageHistory(
                application_id=target_app.application_id,
                previous_stage=old_stage,
                new_stage="Offer",
                decision="BLOCK",
                decision_reason="Ground-truth anomaly: attempted stage skip without required reviews (R003)",
                actor="Synthetic Anomaly Injector",
                timestamp=datetime(2026, 2, 1, 12, 0, 0),
                related_rule_id="R003"
            ))

            exc_id = f"EXC-2026-{exc_counter:06d}"
            exc_counter += 1
            exc = ExceptionLog(
                exception_id=exc_id,
                entity_type="Application",
                entity_id=target_app.application_id,
                issue_type="Candidate moves forward without required review",
                severity="Critical",
                detected_rule_id="R003",
                expected_decision="BLOCK",
                actual_decision="ADVANCED",
                resolution_status="Open",
                comments="Candidate progressed directly to Offer without completing required Technical Interview scorecards.",
                created_at=datetime(2026, 2, 1, 10, 0, 0)
            )
            db.add(exc)
            exceptions.append(exc)

            self.ground_truth_records.append({
                "record_id": exc_id,
                "entity_type": "Application",
                "entity_id": target_app.application_id,
                "issue_type": "Candidate moves forward without required review",
                "expected_classification": "CRITICAL_ANOMALY",
                "expected_decision": "BLOCK",
                "applicable_rule_id": "R003",
                "scenario_description": "Candidate bypassed mandatory technical scorecard reviews and advanced straight to Offer stage."
            })

        # Anomaly 2: Interviewer double-booked (R006)
        if len(interviews) > 2:
            intv_a = interviews[0]
            intv_b = interviews[1]
            # Share the same panel so the overlapping booking is a real conflict.
            intv_b.panel_id = intv_a.panel_id
            intv_b.scheduled_start = intv_a.scheduled_start
            intv_b.scheduled_end = intv_a.scheduled_end
            intv_b.test_mode_conflict = True

            exc_id = f"EXC-2026-{exc_counter:06d}"
            exc_counter += 1
            exc = ExceptionLog(
                exception_id=exc_id,
                entity_type="Interview",
                entity_id=intv_b.interview_id,
                issue_type="Interviewer double-booked",
                severity="High",
                detected_rule_id="R006",
                expected_decision="BLOCK",
                actual_decision="SCHEDULED",
                resolution_status="Open",
                comments=f"Interviewer double-booked between {intv_a.interview_id} and {intv_b.interview_id} at {intv_a.scheduled_start}.",
                created_at=datetime(2026, 2, 1, 11, 0, 0)
            )
            db.add(exc)
            exceptions.append(exc)

            self.ground_truth_records.append({
                "record_id": exc_id,
                "entity_type": "Interview",
                "entity_id": intv_b.interview_id,
                "issue_type": "Interviewer double-booked",
                "expected_classification": "SCHEDULE_CONFLICT",
                "expected_decision": "BLOCK",
                "applicable_rule_id": "R006",
                "scenario_description": "Interviewer was assigned to simultaneous concurrent interviews violating non-overlap constraint."
            })

        # Anomaly 3: Offer exceeds approved compensation band (R009)
        if len(offers) > 1:
            target_offer = offers[0]
            req = target_offer.application.requisition
            # Set proposed salary 40% above maximum approved band
            target_offer.proposed_salary = req.salary_max * 1.40
            target_offer.band_compliance_status = "Above Maximum Band"

            exc_id = f"EXC-2026-{exc_counter:06d}"
            exc_counter += 1
            exc = ExceptionLog(
                exception_id=exc_id,
                entity_type="Offer",
                entity_id=target_offer.offer_id,
                issue_type="Offer exceeds approved compensation band",
                severity="High",
                detected_rule_id="R009",
                expected_decision="REVIEW",
                actual_decision="APPROVED",
                resolution_status="Open",
                comments=f"Proposed salary (${target_offer.proposed_salary:,.0f}) exceeds approved band max (${req.salary_max:,.0f}) by 40% without Level 2 exception approval.",
                created_at=datetime(2026, 2, 1, 12, 0, 0)
            )
            db.add(exc)
            exceptions.append(exc)

            self.ground_truth_records.append({
                "record_id": exc_id,
                "entity_type": "Offer",
                "entity_id": target_offer.offer_id,
                "issue_type": "Offer exceeds approved compensation band",
                "expected_classification": "BUDGET_OVERRUN",
                "expected_decision": "REVIEW",
                "applicable_rule_id": "R009",
                "scenario_description": "Compensation package exceeded the requisition maximum ceiling without VP compensation exception approval."
            })

        # Anomaly 4: Withdrawn candidate remains scheduled (R004)
        if len(applications) > 3 and len(interviews) > 3:
            withdrawn_app = applications[3]
            previous_stage = withdrawn_app.current_stage
            withdrawn_app.current_stage = "Withdrawn"
            withdrawn_app.application_status = "Inactive"
            withdrawn_app.updated_at = datetime(2026, 2, 2, 12, 0, 0)
            db.add(ApplicationStageHistory(
                application_id=withdrawn_app.application_id,
                previous_stage=previous_stage,
                new_stage="Withdrawn",
                decision="WITHDRAW",
                decision_reason="Ground-truth anomaly fixture: withdrawal recorded while calendar booking remains",
                actor="Synthetic Anomaly Injector",
                timestamp=datetime(2026, 2, 2, 12, 0, 0),
                related_rule_id="R004"
            ))

            scheduled_int = interviews[2]
            scheduled_int.application_id = withdrawn_app.application_id
            scheduled_int.status = "Scheduled"

            exc_id = f"EXC-2026-{exc_counter:06d}"
            exc_counter += 1
            exc = ExceptionLog(
                exception_id=exc_id,
                entity_type="Interview",
                entity_id=scheduled_int.interview_id,
                issue_type="Withdrawn candidate remains scheduled",
                severity="Medium",
                detected_rule_id="R004",
                expected_decision="BLOCK",
                actual_decision="SCHEDULED",
                resolution_status="Open",
                comments=f"Candidate {withdrawn_app.candidate_id} withdrew application {withdrawn_app.application_id}, but interview {scheduled_int.interview_id} remains active on calendar.",
                created_at=datetime(2026, 2, 2, 12, 0, 0)
            )
            db.add(exc)
            exceptions.append(exc)

            self.ground_truth_records.append({
                "record_id": exc_id,
                "entity_type": "Interview",
                "entity_id": scheduled_int.interview_id,
                "issue_type": "Withdrawn candidate remains scheduled",
                "expected_classification": "LIFECYCLE_INCONSISTENCY",
                "expected_decision": "BLOCK",
                "applicable_rule_id": "R004",
                "scenario_description": "Application marked Withdrawn was not decoupled from calendar, leaving active interview slot."
            })

        # Anomaly 5: Evaluation includes irrelevant criteria (R008)
        if len(scorecards) > 1:
            target_sc = scorecards[0]
            target_sc.feedback_comments = (
                (target_sc.feedback_comments or "").rstrip()
                + " | Unapproved criteria: candidate_hobbies"
            )
            exc_id = f"EXC-2026-{exc_counter:06d}"
            exc_counter += 1
            exc = ExceptionLog(
                exception_id=exc_id,
                entity_type="Evaluation",
                entity_id=target_sc.scorecard_id,
                issue_type="Evaluation includes irrelevant criteria",
                severity="High",
                detected_rule_id="R008",
                expected_decision="BLOCK",
                actual_decision="SUBMITTED",
                resolution_status="Open",
                comments="Evaluation scorecard contained unapproved criteria ('Candidate personal hobbies and social background') violating anti-bias policy.",
                created_at=datetime(2026, 2, 2, 13, 0, 0)
            )
            db.add(exc)
            exceptions.append(exc)

            self.ground_truth_records.append({
                "record_id": exc_id,
                "entity_type": "Evaluation",
                "entity_id": target_sc.scorecard_id,
                "issue_type": "Evaluation includes irrelevant criteria",
                "expected_classification": "POLICY_VIOLATION",
                "expected_decision": "BLOCK",
                "applicable_rule_id": "R008",
                "scenario_description": "Interviewer entered non-standard extraneous criteria outside the 5 authorized assessment dimensions."
            })

        db.flush()
        return exceptions

generator = SyntheticDataGenerator()
