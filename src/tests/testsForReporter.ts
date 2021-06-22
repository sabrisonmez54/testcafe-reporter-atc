import { jiraTest } from '../helpers/helpers'

fixture`Tests for Custom ATC Reporter`

jiraTest({
  jiraTestPlanKey: 'CHGFRWRDUS-1030',
  jiraTestKey: 'CHGFRWRDUS-1054',
}).only('Marketing Page UI Audit', async (t) => {
  await t.expect(true).ok()
})

jiraTest({
  // jiraTestPlanKey: 'TESTPROJECT-110',
  // jiraTestKey: 'TESTPROJECT-215',
})('Test UI New Instance 215', async (t) => {
  await t.expect(false).ok()
})

jiraTest({
  jiraTestPlanKey: 'TESTPROJECT-111',
  jiraTestKey: 'TESTPROJECT-223',
})('Test UI New Instance 223', async (t) => {
  await t.expect(true).ok()
})
