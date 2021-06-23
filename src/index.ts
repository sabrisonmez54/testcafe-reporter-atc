import fs = require('fs')
import { JiraMetaData, TestRunInfo } from './interfaces/interfaces'
import fetch from 'node-fetch'
import {
  ExecutionResult,
  TestEvidence,
  TestExecutionIssueResponse,
} from './interfaces/executionResult'

let currentTestMeta: JiraMetaData = null
let jiraServer: string = 'https://atc.bmwgroup.net/jira/rest'
let base64data = Buffer.from(
  `${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`
).toString('base64')
let executionResults: ExecutionResult[] = []

const jiraMetaDataIsValid = (jiraMetaData: JiraMetaData): boolean => {
  if (
    !Object.values(jiraMetaData).includes(undefined) &&
    Object.values(jiraMetaData).length > 1
  ) {
    return true
  } else {
    return false
  }
}

const jiraAuthValid = (): boolean => {
  return base64data !== 'dW5kZWZpbmVkOnVuZGVmaW5lZA==' //undefined:undefined
}

const generateStatus = (testRunInfo: TestRunInfo): string => {
  if (testRunInfo.skipped) return 'TODO'
  if (testRunInfo.errs.length > 0) return 'FAIL'
  if (testRunInfo.errs.length === 0) return 'PASS'
}

const generateScreenshotSection = (
  testRunInfo: TestRunInfo,
  currentTestName: string
): TestEvidence[] => {
  if (testRunInfo.screenshots.length > 0) {
    let testEvidences: TestEvidence[] = []
    for (let screenshot of testRunInfo.screenshots) {
      testEvidences.push({
        data: fs.readFileSync(screenshot.screenshotPath, 'base64'),
        filename: `${currentTestName.replace(/\s+/g, '')}.png`,
        contentType: 'image/png',
      })
    }
    return testEvidences
  } else {
    return []
  }
}

const generateLogSection = (testRunInfo: TestRunInfo): string => {
  if (testRunInfo.errs.length > 0) {
    const err = testRunInfo.errs[0]

    const generalInfo = `UserAgent: ${err.userAgent} \\nApiFnChain ${err.apiFnChain} \\nFileName: ${err.callsite.filename} \\nLineNum: ${err.callsite.lineNum}\\n\\n`
    const errorInfo = err.formatMessage(testRunInfo.errs)
    const errorInfoNewLines = errorInfo.replace(/\n/g, '\\n')
    const errorInfoFormatted = errorInfoNewLines.replace(/(\d+)\s/g, '\\n$1')

    return `${generalInfo} ${errorInfoFormatted}`
  } else {
    return ''
  }
}

const closeTestExecutionTicket = async (testExecutionKey: string) => {
  // https://docs.atlassian.com/software/jira/docs/api/REST/7.6.1/#api/2/issue-doTransition
  try {
    console.log(
      `ATC Reporter: Closing execution ticket: ${testExecutionKey}...`
    )
    const res = await fetch(
      `${jiraServer}/api/2/issue/${testExecutionKey}/transitions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${base64data}`,
        },
        body: JSON.stringify({ transition: { id: '41' } }), // id: 41 -> closed
      }
    )
    if (res.ok) {
      console.log(`ATC Reporter: Closed execution ticket: ${testExecutionKey}`)
    } else {
      console.error(
        `ATC Reporter: There was an error with the response for closing the execution ticket: ${testExecutionKey}`,
        res
      )
    }
  } catch (e) {
    console.error(
      `ATC Reporter: There was an error closing the test execution ticket: ${testExecutionKey}`,
      e
    )
  }
}

const sendXrayResultsToJira = async (executionResult: ExecutionResult) => {
  // https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-XrayJSONresults
  const testKey = executionResult.tests[0].testKey
  try {
    console.log(`ATC Reporter: Sending execution results for: ${testKey}...`)
    const res = await fetch(`${jiraServer}/raven/1.0/import/execution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${base64data}`,
      },
      body: JSON.stringify(executionResult),
    })
    if (res.ok) {
      const data: TestExecutionIssueResponse = await res.json()
      if (data.testExecIssue.key) {
        console.log(
          `ATC Reporter: Successfully sent xray results for ${testKey} to jira.`
        )
        await closeTestExecutionTicket(data.testExecIssue.key)
      } else {
        console.error(
          `ATC Reporter: No testExecIssueKey returned for sendXrayResultsToJira -> ${testKey} to jira.`,
          data
        )
      }
    } else {
      console.error(
        `ATC Reporter: There was an issue with the response for sendXrayResultsToJira `,
        res
      )
    }
  } catch (e) {
    console.error(
      `ATC Reporter: There was an error sending the xray results to jira for ${testKey}.`,
      e
    )
  }
}

exports['default'] = () => {
  return {
    async reportTaskStart(startTime, userAgents, testCount) {},

    async reportFixtureStart(name: string, path: string, meta: JiraMetaData) {},

    async reportTestStart(name: string, meta: JiraMetaData) {},

    async reportTestDone(
      name: string,
      testRunInfo: TestRunInfo,
      meta: JiraMetaData
    ) {
      currentTestMeta = meta
      console.log('ATC Reporter:', name, currentTestMeta)
      if (!jiraMetaDataIsValid(currentTestMeta)) {
        console.warn(
          `ATC Reporter: JiraMetaData missing or undefined. ExecutionResult will not be collected.`,
          name
        )
        return
      }

      let executionResult: ExecutionResult = {
        info: {
          summary: `Execution of automated tests for ${currentTestMeta.jiraTestKey}`,
          testPlanKey: currentTestMeta.jiraTestPlanKey,
        },
        tests: [
          {
            testKey: currentTestMeta.jiraTestKey,
            status: generateStatus(testRunInfo),
            evidences: generateScreenshotSection(testRunInfo, name),
            results: [
              {
                name: 'TestSuite TestCafe Test',
                status: generateStatus(testRunInfo),
                duration: testRunInfo.durationMs,
                log: generateLogSection(testRunInfo),
              },
            ],
          },
        ],
      }
      executionResults.push(executionResult)
    },

    async reportTaskDone(endTime, passed, warnings, result) {
      if (executionResults.length > 0) {
        console.log('ATC Reporter: Uploading all test results to jira...')
        if (!jiraAuthValid()) {
          console.warn(
            `ATC Reporter: Can't upload test results. Jira authentication env variables are invalid. Make sure you define process.env.JIRA_USERNAME and process.env.JIRA_PASSWORD correctly.`,
            `Used jira auth: Basic ${base64data}`
          )
        } else {
          for (let executionResult of executionResults) {
            await sendXrayResultsToJira(executionResult)
          }
        }
      } else {
        console.log(
          'ATC Reporter: There are no execution results to upload to jira.'
        )
      }
    },
  }
}

module.exports = exports['default']
