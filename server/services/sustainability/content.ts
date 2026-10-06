import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import {getSustainabilityRecordsStored, getSustainabilityGoalsStored} from '@/server/services/sustainability/records'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import {decode} from '@/lib/news/contracts'
import type {SustainabilityPageContent} from '@/lib/sustainability/contracts'
import {sectionVisibility} from '@/lib/cms/section-visibility'
export const getSustainability=async()=>{
 const [rows,page]=await Promise.all([getSustainabilityRecordsStored(),WebsiteSetting.where('setting_key','sustainability').firstJson()])
 if(!page)throw new Error('Sustainability content is missing. Run the sustainability seeder.')
 const content=decode<SustainabilityPageContent>(page.value)
 return resolveMediaReferences({articles:rows,page:{...content,goals:await getSustainabilityGoalsStored(),sectionVisibility:sectionVisibility(content.sectionVisibility,['related'] as const)}})
}
