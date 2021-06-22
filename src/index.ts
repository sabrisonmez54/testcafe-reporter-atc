import fs = require('fs')
import { JiraMetaData, TestRunInfo } from './interfaces/interfaces'
import fetch from 'node-fetch'

let currentTestMeta: JiraMetaData = null
let jiraServer: string = 'https://atc.bmwgroup.net/jira/rest'
let base64data = Buffer.from(
  `${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`
).toString('base64')

const jiraMetaDataIsValid = (jiraMetaData: JiraMetaData) => {
  if (
    !Object.values(jiraMetaData).includes(undefined) &&
    Object.values(jiraMetaData).length > 1
  ) {
    return true
  } else {
    return false
  }
}

const generateStatus = (testRunInfo: TestRunInfo) => {
  if (testRunInfo.skipped) return 'TODO'
  if (testRunInfo.errs.length > 0) return 'FAIL'
  if (testRunInfo.errs.length === 0) return 'PASS'
}

const generateScreenshotSection = (
  testRunInfo: TestRunInfo,
  currentTestName: string
) => {
  if (testRunInfo.screenshots.length > 0) {
    let iterations = testRunInfo.screenshots.length
    let screenShotSection: string = ''
    for (let screenshot of testRunInfo.screenshots) {
      screenShotSection += `{
          "data":"${fs.readFileSync(screenshot.screenshotPath, 'base64')}",
          "filename": "${currentTestName.replace(/\s+/g, '')}.png",
          "contentType": "image/png"
        }${!--iterations ? '' : ',\n\t\t\t\t'}`
    }
    return screenShotSection
  } else {
    return ''
  }
}

const generateLogSection = (testRunInfo: TestRunInfo) => {
  if (testRunInfo.errs.length > 0) {
    const err = testRunInfo.errs[0]

    const generalInfo = `UserAgent: ${err.userAgent} \\nApiFnChain ${err.apiFnChain} \\nFileName: ${err.callsite.filename} \\nLineNum: ${err.callsite.lineNum}\\n\\n`
    const errorInfo = err.formatMessage(testRunInfo.errs)
    const errorInfoNewLines = errorInfo.replace(/\n/g, '\\n')
    const errorInfoFormatted = errorInfoNewLines.replace(/(\d+)\s{1}/g, '\\n$1')

    return `${generalInfo} ${errorInfoFormatted}`
  } else {
    return ''
  }
}

const closeTestExecutionTicket = async (testExecutionKey: string) => {
  // https://docs.atlassian.com/software/jira/docs/api/REST/7.6.1/#api/2/issue-doTransition
  try {
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
        `ATC Reporter: There was an error with the response for closing the execution ticket: ${testExecutionKey}`
      )
    }
  } catch (e) {
    console.error(
      `ATC Reporter: There was an error closing the test execution ticket: ${testExecutionKey}`,
      e
    )
  }
}

const sendXrayResultsToJira = async (xrayResults: string) => {
  // https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-XrayJSONresults
  try {
    const res = await fetch(`${jiraServer}/raven/1.0/import/execution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${base64data}`,
      },
      body: JSON.stringify(JSON.parse(xrayResults)),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.testExecIssue.key) {
        console.log(
          `ATC Reporter: Successfully sent xray results for ${currentTestMeta.jiraTestKey} to jira.`,
          data
        )
        await closeTestExecutionTicket(data.testExecIssue.key)
      }
    } else {
      console.error(
        `ATC Reporter: There was an issue with the response for sendXrayResultsToJira `
      )
    }
  } catch (e) {
    console.error(
      `ATC Reporter: There was an error sending the xray results to jira for ${currentTestMeta.jiraTestKey}.`,
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
          `ATC Reporter: No xray json generated. JiraMetaData missing or undefined`,
          name
        )
      } else {
        const xrayResults = `{
  "info" : {
    "summary" : "Execution of automated tests for ${
      currentTestMeta.jiraTestKey
    }",
    "testPlanKey" : "${currentTestMeta.jiraTestPlanKey}"
  },
  "tests" : [
    {
      "testKey" : "${currentTestMeta.jiraTestKey}",
      "status" : "${generateStatus(testRunInfo)}",
      "evidences" : [
        ${generateScreenshotSection(testRunInfo, name)}
      ],
      "results":[
        {
          "name":"TestSuite TestCafe Test",
          "status":"${generateStatus(testRunInfo)}",
          "duration":${testRunInfo.durationMs},
          "log":"${generateLogSection(testRunInfo)}"
        }
      ]
    }
  ]
}`
        await sendXrayResultsToJira(xrayResults)
      }
    },

    async reportTaskDone(endTime, passed, warnings, result) {},
  }
}

module.exports = exports['default']
