import { jiraTest } from '../helpers/helpers'

fixture`Tests for Custom ATC Reporter`

jiraTest({
  jiraTestPlanKey: 'CHGFRWRDUS-1030',
  jiraTestKey: 'CHGFRWRDUS-1054',
})('Marketing Page UI Audit', async (t) => {
  await t.expect(false).ok()
})

jiraTest({
  jiraTestPlanKey: 'CHGFRWRDUS-1030',
  jiraTestKey: 'CHGFRWRDUS-1054',
})('Marketing Page UI Audit', async (t) => {
  await t.expect(true).ok()
})

jiraTest({
  jiraTestPlanKey: 'CHGFRWRDUS-1030',
  jiraTestKey: 'CHGFRWRDUS-1054',
})('Marketing Page UI Audit', async (t) => {
  await t.expect(true).ok()
})
