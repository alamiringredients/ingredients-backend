import {DB} from '@holo-js/db'
import {cmsLocales, type CmsLocale} from '../../lib/cms/contracts'
import type {SustainabilityContent} from '../../lib/sustainability/contracts'
import {getSustainabilityRecords} from '../../server/services/sustainability/records'
import SustainabilityArticle from '../../server/models/SustainabilityArticle'
import SustainabilityArticleTranslation from '../../server/models/SustainabilityArticleTranslation'
import SustainabilityPublication from '../../server/models/SustainabilityPublication'
import SustainabilityRevision from '../../server/models/SustainabilityRevision'

export async function persistSustainability({id, revision, slug, content, operation, locale}: {
  id: number
  revision: number
  slug: string
  content: SustainabilityContent
  operation: 'save' | 'publish' | 'unpublish'
  locale: CmsLocale
}) {
  return DB.writeTransaction(async () => {
    const current=id?await SustainabilityArticle.find(id):null
    if(id&&!current)throw new Error('Article not found.')
    if(current&&Number(current.revision)!==revision)throw new Error('This article changed in another session. Reload before saving.')
    if(current&&current.slug!==slug)throw new Error('Existing article URLs are permanent.')
    const existing=current?(await getSustainabilityRecords(id))[0]:undefined
    const nextRevision=revision+1
    const values={slug,revision:nextRevision,article_date:new Date(`${content.date}T00:00:00.000Z`),updated_date:new Date(`${content.updatedDate}T00:00:00.000Z`),featured:content.featured,sort_order:content.sortOrder,primary_goal_id:content.primaryGoal||null}
    const article=current??await SustainabilityArticle.create(values)
    if(current)await article.update(values)
    for(const language of cmsLocales)await SustainabilityArticleTranslation.upsert({article_id:Number(article.id),locale:language},{content:content.locales[language]})
    await article.goals().sync(content.goalIds)
    const published={...existing?.published}
    if(operation==='publish'){
      const {locales:versions,...metadata}=content
      await SustainabilityPublication.upsert({article_id:Number(article.id),locale},{revision:nextRevision,article_date:new Date(`${content.date}T00:00:00.000Z`),featured:content.featured,sort_order:content.sortOrder,metadata,content:versions[locale],published_at:new Date()})
      published[locale]=versions[locale]
    }else if(operation==='unpublish'){
      await SustainabilityPublication.where('article_id',article.id).where('locale',locale).delete()
      delete published[locale]
    }
    if(existing){
      await SustainabilityRevision.create({article_id:Number(article.id),revision:existing.revision,content:existing.content})
      const retained=await SustainabilityRevision.where('article_id',article.id).orderBy('id','desc').limit(10).get()
      if(retained.length===10)await SustainabilityRevision.where('article_id',article.id).where('id','<',retained.at(-1)!.id).delete()
    }
    return {id:Number(article.id),revision:nextRevision,content,published}
  })
}
