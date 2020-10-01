import { CallsiteRecord } from 'callsite-record'

export interface JiraMetaData {
  jiraTestPlanKey: string
  jiraTestKey: string
}

export interface TestRunInfo {
  browsers: BrowserInfo[]
  durationMs: number
  errs: CallsiteError[]
  screenshotPath: string | null
  screenshots: Screenshot[]
  skipped: boolean
  videos: unknown[]
  warnings: string[]
}

export interface BrowserInfo {
  alias: string
  engine: unknown
  headless: boolean
  name: string
  os: unknown
  platform: string
  prettyUserAgent: string
  testRunId: string
  userAgent: string
  version: string
}

export interface Screenshot {
  screenshotPath: string
  thumbnailPath: string
  userAgent: string
  quarantineAttempt: number | null
  takenOnFail: boolean
  testRunId: string
}

export interface CallsiteError {
  formatMessage(errs: CallsiteError[]): string
  getErrorMarkup(): Function
  apiFnChain: string[]
  callsite: CallsiteInterface
  code: string
  errMsg: string
  isTestCafeError: boolean
  originError: string
  screenshotPath: string
  testRunId: string
  testRunPhase: string
  type: TestCafeErrorType
  userAgent: string
}

export interface CallsiteInterface extends CallsiteRecord {
  filename: string
  lineNum: number
  stackFrames: StackFrame[]
  callsiteFrameIdx: number
  isV8Frames: boolean
}

export interface StackFrame {
  getFileName: () => string
  getLineNumber: () => number
  getColumnNumber: () => number
  fileName: string
  lineNumber: number
  columnNumber: number
  source: string
  functionName?: string
}


export type TestCafeErrorType =
  | 'actionAdditionalElementIsInvisibleError'
  | 'actionAdditionalElementNotFoundError'
  | 'actionAdditionalSelectorMatchesWrongNodeTypeError'
  | 'actionBooleanOptionError'
  | 'actionCanNotFindFileToUploadError'
  | 'actionElementIsInvisibleError'
  | 'actionElementIsNotFileInputError'
  | 'actionElementNonContentEditableError'
  | 'actionElementNonEditableError'
  | 'actionElementNotFoundError'
  | 'actionElementNotFoundError'
  | 'actionElementNotIframeError'
  | 'actionElementNotTextAreaError'
  | 'actionIframeIsNotLoadedError'
  | 'actionIncorrectKeysError'
  | 'actionIntegerArgumentError'
  | 'actionIntegerOptionError'
  | 'actionInvalidScrollTargetError'
  | 'actionNullableStringArgumentError'
  | 'actionOptionsTypeError'
  | 'actionPositiveIntegerArgumentError'
  | 'actionPositiveIntegerOptionError'
  | 'actionRoleArgumentError'
  | 'actionRootContainerNotFoundError'
  | 'actionSelectorError'
  | 'actionSelectorMatchesWrongNodeTypeError'
  | 'actionSpeedOptionError'
  | 'actionStringArgumentError'
  | 'actionStringArrayElementError'
  | 'actionStringOrStringArrayArgumentError'
  | 'actionUnsupportedDeviceTypeError'
  | 'assertionExecutableArgumentError'
  | 'cantObtainInfoForElementSpecifiedBySelectorError'
  | 'clientFunctionExecutionInterruptionError'
  | 'currentIframeIsInvisibleError'
  | 'currentIframeIsNotLoadedError'
  | 'currentIframeNotFoundError'
  | 'domNodeClientFunctionResultError'
  | 'externalAssertionLibraryError'
  | 'invalidElementScreenshotDimensionsError'
  | 'invalidSelectorResultError'
  | 'missingAwaitError'
  | 'nativeDialogNotHandledError'
  | 'pageLoadError'
  | 'roleSwitchInRoleInitializerError'
  | 'setNativeDialogHandlerCodeWrongTypeError'
  | 'setTestSpeedArgumentError'
  | 'uncaughtErrorInClientFunctionCode'
  | 'uncaughtErrorInCustomDOMPropertyCode'
  | 'uncaughtErrorInNativeDialogHandler'
  | 'uncaughtErrorInTestCode'
  | 'uncaughtErrorOnPage'
  | 'uncaughtNonErrorObjectInTestCode'
  | 'windowDimensionsOverflowError'

