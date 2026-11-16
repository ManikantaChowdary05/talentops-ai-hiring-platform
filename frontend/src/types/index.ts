export interface User {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SkillRequirement {
  id?: number;
  skill_name: string;
  is_mandatory: boolean;
  min_proficiency: number;
  min_experience_years: number;
}

export interface Requisition {
  requisition_id: string;
  job_title: string;
  department: string;
  location: string;
  hiring_manager_id: string;
  employment_type: string;
  experience_min: number;
  experience_max: number;
  salary_min: number;
  salary_max: number;
  positions_available: number;
  requisition_status: string;
  created_date: string;
  approved_date: string | null;
  expected_closing_date: string | null;
  skill_requirements: SkillRequirement[];
}

export interface CandidateSkill {
  id?: number;
  skill_name: string;
  proficiency_level: number;
  experience_years: number;
}

export interface Candidate {
  candidate_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string;
  education: string;
  experience_years: number;
  current_role: string | null;
  current_company: string | null;
  expected_salary: number;
  skills: string | null;
  profile_created_date: string;
  candidate_skills: CandidateSkill[];
}

export interface Application {
  application_id: string;
  candidate_id: string;
  requisition_id: string;
  current_stage: string;
  application_status: string;
  applied_date: string;
  updated_at: string;
  candidate_name?: string;
  job_title?: string;
  department?: string;
}

export interface StageHistory {
  history_id: number;
  application_id: string;
  previous_stage: string | null;
  new_stage: string;
  decision: string;
  decision_reason: string;
  actor: string;
  timestamp: string;
  related_rule_id: string | null;
}

export interface Interview {
  interview_id: string;
  application_id: string;
  panel_id: string;
  interview_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  calendar_notes: string | null;
  test_mode_conflict: boolean;
  candidate_name?: string;
  job_title?: string;
}

export interface Availability {
  availability_id: number;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export interface Scorecard {
  scorecard_id: string;
  interview_id: string;
  reviewer_id: string;
  reviewer_name?: string;
  technical_knowledge: number;
  problem_solving: number;
  communication: number;
  role_specific_skills: number;
  collaboration: number;
  weighted_score: number;
  recommendation: string;
  feedback_comments: string;
  rubric_version: string;
  is_complete: boolean;
  has_disagreement: boolean;
  submitted_at: string;
}

export interface Offer {
  offer_id: string;
  application_id: string;
  proposed_salary: number;
  currency: string;
  bonus: number;
  joining_date: string;
  offer_status: string;
  version: number;
  created_by: string;
  created_at: string;
  band_compliance_status: string;
  candidate_name?: string;
  job_title?: string;
  salary_min?: number;
  salary_max?: number;
}

export interface Approval {
  approval_id: string;
  offer_id: string;
  approver_id: string;
  approver_name?: string;
  approval_level: number;
  decision: string;
  comments: string | null;
  timestamp: string;
}

export interface ExceptionItem {
  exception_id: string;
  entity_type: string;
  entity_id: string;
  issue_type: string;
  severity: string;
  detected_rule_id: string;
  expected_decision: string;
  actual_decision: string;
  resolution_status: string;
  comments: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AuditLogItem {
  log_id: number;
  user_id: string | null;
  user_name?: string;
  action: string;
  entity: string;
  entity_id: string;
  previous_value: string | null;
  new_value: string | null;
  timestamp: string;
  reason: string | null;
}

export interface DashboardMetrics {
  summary_kpis: {
    total_requisitions: number;
    approved_requisitions: number;
    open_requisitions: number;
    total_candidates: number;
    total_applications: number;
    active_candidates: number;
    interviews_scheduled: number;
    completed_interviews: number;
    pending_scorecards: number;
    offers_generated: number;
    pending_approvals: number;
    successful_hires: number;
    conversion_rate: number;
    avg_time_to_hire_days: number;
    time_to_fill_days: number;
    exception_count: number;
    open_exceptions: number;
    resolved_exceptions: number;
    app_to_interview_rate: number;
    interview_completion_rate: number;
    scorecard_completion_rate: number;
    offer_acceptance_rate: number;
    rescheduling_rate: number;
    conflict_rate: number;
    offer_exception_rate: number;
    exception_precision: number;
    exception_recall: number;
  };
  charts: {
    funnel: Array<{ stage: string; count: number; conversion: string }>;
    department_distribution: Array<{ department: string; requisitions: number }>;
    status_distribution: Array<{ status: string; count: number }>;
    exception_severity: Array<{ severity: string; count: number }>;
    application_trends: Array<{ month: string; applications: number; interviews: number; hires: number }>;
  };
}
