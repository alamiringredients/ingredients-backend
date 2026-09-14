import 'server-only'

import CareerJob from '@/server/models/CareerJob'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import {aboutSectionKeys,careersSectionKeys,type AboutContent,type CareersContent,type JobRecord} from '@/lib/careers/contracts'
import {sectionVisibility} from '@/lib/cms/section-visibility'
import {decodeStoredJson} from '@/lib/cms/stored-json'
export const decode = decodeStoredJson
export const getJobs=async():Promise<JobRecord[]> => (await CareerJob.orderBy('id').getJson()).map(r=>({id:Number(r.id),slug:r.slug,code:r.code,status:r.status as JobRecord['status'],content:decode(r.content)}))
async function readEditorialContent(page: 'about' | 'careers') {
  const row = await WebsiteSetting.where('setting_key', page).firstJson()
  if (!row) throw new Error('Run the careers_about seeder.')
  return decode<AboutContent & CareersContent>(row.value)
}

export const getEditorialPage = async (page: 'about' | 'careers') => {
  const content = await readEditorialContent(page)
  return {...content, sectionVisibility: sectionVisibility(content.sectionVisibility, page === 'about' ? aboutSectionKeys : careersSectionKeys)}
}
