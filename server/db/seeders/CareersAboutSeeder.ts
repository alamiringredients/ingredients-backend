import {DB, defineSeeder} from '@holo-js/db'
import source from '../seed-data/site-content.json'
import CareerJob from '@/server/models/CareerJob'
import WebsiteSetting from '@/server/models/WebsiteSetting'
export default defineSeeder({name: 'careers_about', async run() {
  await CareerJob.unguarded(async () => {
    for (const job of source.career_jobs) if (!await CareerJob.find(job.id)) await DB.table('career_jobs').insert({...job, content: JSON.stringify(job.content)})
  })
  for (const key of ['about', 'careers']) {
    const setting = source.website_settings.find(row => row.setting_key === key)!
    await WebsiteSetting.firstOrCreate({setting_key: key}, {value: setting.value})
  }
}})
