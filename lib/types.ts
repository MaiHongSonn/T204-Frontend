// Core domain types for RAG Test Studio (prototype, mock data only)

export type UserRole = "QA" | "DEV"

export type RequirementQuality = "ready" | "low"

export type TargetStatus = "configured" | "not_configured"

export interface ClarificationQuestion {
  id: string
  category: "Safety" | "Security" | "Hành vi" | "Hiệu năng"
  sequence: number
  total: number
  question: string
  status: "open" | "answered" | "skipped"
  answer?: string
  answeredAt?: string
}

export interface RequirementVersion {
  version: number
  text: string
  updatedAt: string
}

export interface Requirement {
  currentVersion: number
  text: string
  updatedAt: string
  quality: RequirementQuality
  clarifications: ClarificationQuestion[]
  history: RequirementVersion[]
}

export interface TargetConfigVersion {
  version: number
  endpoint: string
  method: "POST"
  answerJsonPath: string
  requestSchema: string
  responseSchema: string
  updatedAt: string
  changedFields: string[]
}

export interface TargetConfig {
  currentVersion: number
  endpoint: string
  method: "POST"
  answerJsonPath: string
  requestSchema: string
  responseSchema: string
  updatedAt: string
  history: TargetConfigVersion[]
  status: TargetStatus
}

export interface ContextVersion {
  version: number
  content: string
  charCount: number
  updatedAt: string
}

export interface ReferenceContext {
  id: string
  name: string
  content: string
  currentVersion: number
  charCount: number
  updatedAt: string
  active: boolean
  history: ContextVersion[]
}

export type TestCaseCategory = "happy_path" | "edge_case" | "safety" | "hallucination"

export type TestCaseSource = "llm_generated" | "manual" | "red_teaming"

export interface MetricConfig {
  id: string
  type:
    | "faithfulness"
    | "answer_relevancy"
    | "g_eval"
    | "safety_toxicity"
    | "json_correctness"
    | "exact_regex_match"
  threshold: number
  rubric?: string
  expectedValue?: string
}

export interface TestCase {
  id: string
  suiteId: string
  title: string
  scenario: string
  category: TestCaseCategory
  source: TestCaseSource
  requirementQuality: RequirementQuality
  contextVersionIds: string[]
  revision: number
  requestPayload: string
  expectedBehavior: string
  rubric: string
  requiredKeywords: string[]
  forbiddenKeywords: string[]
  requiredRegexes: string[]
  forbiddenRegexes: string[]
  maxLatencyMs: number
  metrics: MetricConfig[]
  archived: boolean
  lastRunOutcome?: CaseOutcome
  lastRunAt?: string
}

export type CaseOutcome = "passed" | "failed" | "error"

export type CaseRunState = "queued" | "executing" | "evaluating" | "passed" | "failed" | "error"

export interface RuleResult {
  rule: string
  status: "passed" | "failed" | "not_run"
  observedValue?: string
  reason: string
}

export interface MetricResult {
  metric: string
  score?: number
  threshold: number
  gating: boolean
  status: "passed" | "failed" | "not_run" | "reference"
  reason: string
}

export interface CaseRunResult {
  caseId: string
  caseTitle: string
  category: TestCaseCategory
  state: CaseRunState
  httpStatus?: number
  latencyMs?: number
  score?: number
  extractedAnswer?: string
  ruleResults: RuleResult[]
  metricResults: MetricResult[]
  testCaseRevision: number
}

export type SuiteRunStatus = "queued" | "dispatching" | "running" | "completed"

export interface SuiteRun {
  id: string
  suiteId: string
  status: SuiteRunStatus
  outcome?: "passed" | "failed" | "error"
  createdAt: string
  completedAt?: string
  targetConfigVersion: number
  requirementVersion: number
  requirementQuality: RequirementQuality
  cases: CaseRunResult[]
  timeline: { label: string; timestamp: string }[]
}

export interface TestSuite {
  id: string
  projectId: string
  name: string
  description: string
  active: boolean
  updatedAt: string
  lastRunId?: string
}

export type GenerationStatus = "queued" | "running" | "completed" | "failed"

export interface GenerationPlan {
  happy_path: number
  edge_case: number
  safety: number
  hallucination: number
}

export interface GenerationOperation {
  id: string
  suiteId: string
  status: GenerationStatus
  contextIds: string[]
  plan: GenerationPlan
  failureReason?: string
  createdAt: string
}

export interface ActivityItem {
  id: string
  label: string
  timestamp: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: "active" | "archived"
  updatedAt: string
  target: TargetConfig
  requirement: Requirement
  contexts: ReferenceContext[]
  suites: TestSuite[]
  runs: SuiteRun[]
  generations: GenerationOperation[]
  activity: ActivityItem[]
}
