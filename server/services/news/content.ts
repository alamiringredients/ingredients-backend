import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import {getNewsRecordsStored} from '@/server/services/news/records'
import NewsTaxonomy from '@/server/models/NewsTaxonomy'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import {decode,newsPageSectionKeys,type NewsTaxonomy as Taxonomy,type NewsPageContent} from '@/lib/news/contracts'
import {sectionVisibility} from '@/lib/cms/section-visibility'
export const getNews = async()=>{
  const [articles,taxonomies,setting]=await Promise.all([getNewsRecordsStored(),NewsTaxonomy.orderBy('sort_order').orderBy('id').getJson(),WebsiteSetting.where('setting_key','news').firstJson()])
  if(!setting)throw new Error('News content is missing. Run the news seeder.')
  const page=decode<NewsPageContent>(setting.value)
  return resolveMediaReferences({articles,taxonomies:taxonomies.map(r=>({id:Number(r.id),kind:r.kind as Taxonomy['kind'],slug:String(r.slug),sort_order:Number(r.sort_order),content:decode<Taxonomy['content']>(r.content)})),page:{...page,sectionVisibility:sectionVisibility(page.sectionVisibility,newsPageSectionKeys)}})
}
