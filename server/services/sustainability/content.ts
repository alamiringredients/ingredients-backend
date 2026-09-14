import 'server-only'

import {getSustainabilityRecords, getSustainabilityGoals} from '@/server/services/sustainability/records'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import {decode} from '@/lib/news/contracts'
import type {SustainabilityPageContent} from '@/lib/sustainability/contracts'
import {sectionVisibility} from '@/lib/cms/section-visibility'
export const getSustainability=async()=>{
 const [rows,page]=await Promise.all([getSustainabilityRecords(),WebsiteSetting.where('setting_key','sustainability').firstJson()])
 if(!page)throw new Error('Sustainability content is missing. Run the sustainability seeder.')
 const content=decode<SustainabilityPageContent>(page.value)
 return {articles:rows,page:{...content,goals:await getSustainabilityGoals(),sectionVisibility:sectionVisibility(content.sectionVisibility,['related'] as const)}}
}
