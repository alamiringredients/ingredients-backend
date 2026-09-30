import assert from 'node:assert/strict'
import {test} from 'node:test'
import {validate, isValidationException} from '@holo-js/forms'
import {goalForm} from '../app/admin/sustainability-goals/schema'
import {newSustainabilityArticle} from '../lib/sustainability/contracts'
import {validateSustainabilityContent} from '../lib/sustainability/validation'
import {validateDocument} from '../lib/editor/document'
import goals from '../server/db/seed-data/sustainability-goals.json'
import seed from '../server/db/seed-data/site-content.json'

test('goal records own localized identity independently of page settings', async () => {
  const page = seed.website_settings.find(row => row.setting_key === 'sustainability')!.value
  assert.equal('goals' in page, false)
  assert.ok(goals.length > 0)
  for (const goal of goals) await validate({...goal,sortOrder:0}, goalForm)
  await assert.rejects(validate({...goals[0],color:'invalid',sortOrder:0},goalForm),isValidationException)
  const ids = new Set(goals.map(goal => goal.id))
  for (const article of seed.sustainability_articles) {
    assert.ok(article.content.goalIds.every(id => ids.has(id)))
    assert.ok(ids.has(article.content.primaryGoal))
  }
})

test('newly created goal IDs work in articles and section selections', () => {
  const article = newSustainabilityArticle().content
  article.goalIds = [18, 25]
  article.primaryGoal = 25
  assert.deepEqual(validateSustainabilityContent(article).goalIds,[18,25])
  article.primaryGoal = 26
  assert.throws(() => validateSustainabilityContent(article))
  const document = validateDocument({type:'doc',content:[{type:'contentSection',attrs:{id:'goals',goals:[25]},content:[{type:'paragraph'}]}]})
  assert.deepEqual(document.content[0].attrs?.goals,[25])
})
