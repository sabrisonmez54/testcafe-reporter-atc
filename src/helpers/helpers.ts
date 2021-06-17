import {JiraMetaData} from '../interfaces/interfaces';
import {t} from 'testcafe'

export const jiraTest = (meta: JiraMetaData) => test.meta(meta)
