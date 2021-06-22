export interface ExecutionResult {
  testExecutionKey?: string
  info?: ExecutionResultInfo
  tests?: ExecutionResultTest[]
}

export interface ExecutionResultInfo {
  summary?: string
  description?: string
  version?: string
  user?: string
  revision?: string
  startDate?: string
  finishDate?: string
  testPlanKey?: string
  testEnvironments?: string[]
}

export interface ExecutionResultTest {
  testKey?: string
  start?: string
  finish?: string
  comment?: string
  status?: string
  evidences?: TestEvidence[]
  results?: TestResult[]
  examples?: string[]
  steps?: TestStep[]
  defects?: string[]
}

export interface TestEvidence {
  data?: string
  filename?: string
  contentType?: string
}

export interface TestResult {
  name?: string
  duration?: number
  log?: string
  status?: string
  examples?: string[]
}

export interface TestStep {
  status?: string
  comment?: string
  evidences?: TestEvidence[]
  actualResult?: string
}

export interface TestExecIssue {
  id?: string
  key?: string
  self?: string
}

export interface TestExecutionIssueResponse {
  testExecIssue?: TestExecIssue
}
