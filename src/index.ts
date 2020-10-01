import fs = require('fs')
import { JiraMetaData, TestRunInfo } from './shared/interfaces'
const execSync = require('child_process').execSync

//jira meta data:
// {
//     jiraTestPlanKey: string
//     jiraTestKey: string
// }

const jiraMetaDataIsValid = (jiraMetaData: JiraMetaData) => {
  if (!Object.values(jiraMetaData).includes(undefined) && Object.values(jiraMetaData).length > 1) {
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

const generateScreenshotSection = (testRunInfo: TestRunInfo, currentTestName: string) => {
  if (testRunInfo.screenshots.length > 0) {
    let iterations = testRunInfo.screenshots.length
    let screenShotSection: string = ''
    for (let screenshot of testRunInfo.screenshots) {
      screenShotSection += (`{
          "data":"${fs.readFileSync(screenshot.screenshotPath, 'base64')}",
          "filename": "${currentTestName.replace(/\s+/g, '')}.png",
          "contentType": "image/png"
        }${(!--iterations) ? '' : ',\n\t\t\t\t'}`
      )
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
    const errorInfoNewLines = errorInfo.replace(/\n/g, "\\n")
    const errorInfoFormatted = errorInfoNewLines.replace(/(\d+)\s{1}/g, '\\n$1')

    return `${generalInfo} ${errorInfoFormatted}`
  } else {
    return ""
  }
}

exports['default'] = () => {

  let currentTestMeta: JiraMetaData = null
  let reportDirPath: string = 'e2e/reports'
  let currentJiraReportPath: string = ''
  let jiraUploadAllReportsPath: string = `${reportDirPath}/uploadAllJiraReports.sh`

  return {

    async reportTaskStart(startTime, userAgents, testCount) {
      console.log("reportTaskStart")
    },

    async reportFixtureStart(name: string, path: string, meta: JiraMetaData) {
      console.log("reportFixtureStart", name)
    },

    async reportTestStart(name: string, meta: JiraMetaData) {
      console.log("reportTestStart", name)
    },

    async reportTestDone(name: string, testRunInfo: TestRunInfo, meta: JiraMetaData) {
      console.log("reportTestDone", name)
      currentTestMeta = meta
      console.log("Current test meta:", currentTestMeta)
      if (!jiraMetaDataIsValid(currentTestMeta)) {
        console.warn(`No xray json generated. JiraMetaData missing or undefined`, name)
      } else {
        currentJiraReportPath = `${reportDirPath}/${currentTestMeta.jiraTestKey}.json`

        const newFileContent =
          `{
  "info" : {
    "summary" : "Execution of automated tests for ${currentTestMeta.jiraTestKey}",
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

        fs.appendFileSync(currentJiraReportPath, newFileContent)

        const curlCommand = `curl -H "Content-Type: application/json" -X POST -u $JIRA_USERNAME:$JIRA_PASSWORD --data @${currentTestMeta.jiraTestKey}.json https://atc.bmwgroup.net/jira/rest/raven/1.0/import/execution`
        fs.appendFileSync(jiraUploadAllReportsPath, `${curlCommand}\n`)
      }
    },

    async reportTaskDone(endTime, passed, warnings, result) {
      execSync(`chmod +x ${jiraUploadAllReportsPath}`,)
      console.log("reportTaskDone")
    }

  }
}

module.exports = exports['default']