"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const node_fetch_1 = require("node-fetch");
let currentTestMeta = null;
let jiraServer = 'https://atc.bmwgroup.net/jira/rest';
let base64data = Buffer.from(`${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`).toString('base64');
let executionResults = [];
const jiraMetaDataIsValid = (jiraMetaData) => {
    if (!Object.values(jiraMetaData).includes(undefined) &&
        Object.values(jiraMetaData).length > 1) {
        return true;
    }
    else {
        return false;
    }
};
const jiraAuthValid = () => {
    return base64data !== 'dW5kZWZpbmVkOnVuZGVmaW5lZA=='; //undefined:undefined
};
const generateStatus = (testRunInfo) => {
    if (testRunInfo.skipped)
        return 'TODO';
    if (testRunInfo.errs.length > 0)
        return 'FAIL';
    if (testRunInfo.errs.length === 0)
        return 'PASS';
};
const generateScreenshotSection = (testRunInfo, currentTestName) => {
    if (testRunInfo.screenshots.length > 0) {
        let testEvidences = [];
        for (let screenshot of testRunInfo.screenshots) {
            testEvidences.push({
                data: fs.readFileSync(screenshot.screenshotPath, 'base64'),
                filename: `${currentTestName.replace(/\s+/g, '')}.png`,
                contentType: 'image/png',
            });
        }
        return testEvidences;
    }
    else {
        return [];
    }
};
const generateLogSection = (testRunInfo) => {
    if (testRunInfo.errs.length > 0) {
        const err = testRunInfo.errs[0];
        const generalInfo = `UserAgent: ${err.userAgent} \\nApiFnChain ${err.apiFnChain} \\nFileName: ${err.callsite.filename} \\nLineNum: ${err.callsite.lineNum}\\n\\n`;
        const errorInfo = err.formatMessage(testRunInfo.errs);
        const errorInfoNewLines = errorInfo.replace(/\n/g, '\\n');
        const errorInfoFormatted = errorInfoNewLines.replace(/(\d+)\s/g, '\\n$1');
        return `${generalInfo} ${errorInfoFormatted}`;
    }
    else {
        return '';
    }
};
const closeTestExecutionTicket = async (testExecutionKey) => {
    // https://docs.atlassian.com/software/jira/docs/api/REST/7.6.1/#api/2/issue-doTransition
    try {
        const res = await node_fetch_1.default(`${jiraServer}/api/2/issue/${testExecutionKey}/transitions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${base64data}`,
            },
            body: JSON.stringify({ transition: { id: '41' } }),
        });
        if (res.ok) {
            console.log(`ATC Reporter: Closed execution ticket: ${testExecutionKey}`);
        }
        else {
            console.error(`ATC Reporter: There was an error with the response for closing the execution ticket: ${testExecutionKey}`, res);
        }
    }
    catch (e) {
        console.error(`ATC Reporter: There was an error closing the test execution ticket: ${testExecutionKey}`, e);
    }
};
const sendXrayResultsToJira = async (executionResult) => {
    // https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-XrayJSONresults
    const testKey = executionResult.tests[0].testKey;
    try {
        console.log(`ATC Reporter: Sending execution results for: ${testKey}`);
        console.log(`Basic ${base64data}`);
        console.log(`${process.env.JIRA_USERNAME}:${process.env.JIRA_PASSWORD}`);
        return;
        const res = await node_fetch_1.default(`${jiraServer}/raven/1.0/import/execution`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${base64data}`,
            },
            body: JSON.stringify(executionResult),
        });
        if (res.ok) {
            const data = await res.json();
            if (data.testExecIssue.key) {
                console.log(`ATC Reporter: Successfully sent xray results for ${testKey} to jira.`);
                await closeTestExecutionTicket(data.testExecIssue.key);
            }
            else {
                console.error(`ATC Reporter: No testExecIssueKey returned for sendXrayResultsToJira -> ${testKey} to jira.`, data);
            }
        }
        else {
            console.error(`ATC Reporter: There was an issue with the response for sendXrayResultsToJira `, res);
        }
    }
    catch (e) {
        console.error(`ATC Reporter: There was an error sending the xray results to jira for ${testKey}.`, e);
    }
};
exports['default'] = () => {
    return {
        async reportTaskStart(startTime, userAgents, testCount) { },
        async reportFixtureStart(name, path, meta) { },
        async reportTestStart(name, meta) { },
        async reportTestDone(name, testRunInfo, meta) {
            currentTestMeta = meta;
            console.log('ATC Reporter:', name, currentTestMeta);
            if (!jiraMetaDataIsValid(currentTestMeta)) {
                console.warn(`ATC Reporter: No xray json generated. JiraMetaData missing or undefined`, name);
                return;
            }
            let executionResult = {
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
            };
            executionResults.push(executionResult);
        },
        async reportTaskDone(endTime, passed, warnings, result) {
            if (executionResults.length > 0) {
                console.log('ATC Reporter: Uploading all test results to jira...');
                if (!jiraAuthValid()) {
                    console.warn(`ATC Reporter: Can't upload test results. Jira authentication env variables are invalid. Make sure you define process.env.JIRA_USERNAME and process.env.JIRA_PASSWORD correctly.`);
                }
                else {
                    for (let executionResult of executionResults) {
                        await sendXrayResultsToJira(executionResult);
                    }
                }
            }
        },
    };
};
module.exports = exports['default'];
