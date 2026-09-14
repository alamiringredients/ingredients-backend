import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

function json(value:unknown):Json{
  return (typeof value==='string'?JSON.parse(value):value) as Json
}

function imageInColumns(node:Json):Json|undefined{
  if(node.type!=='columns'||!Array.isArray(node.content))return
  for(const column of node.content as Json[]){
    if(!Array.isArray(column.content))continue
    const image=(column.content as Json[]).find(child=>child.type==='image')
    if(image)return image
  }
}

function restoreAboutLayout(value:Json):void{
  const visit=(node:unknown):void=>{
    if(Array.isArray(node)){node.forEach(visit);return}
    if(!node||typeof node!=='object')return
    const block=node as Json,image=imageInColumns(block),imageAttrs=image?.attrs as Json|undefined
    if(imageAttrs){
      const src=String(imageAttrs.src??'')
      const attrs=(block.attrs as Json|undefined)??{}
      if(src.endsWith('/heritage-commodities.webp'))attrs.mediaSide='end'
      if(src.endsWith('/cft-line.webp')){attrs.mediaSide='start';imageAttrs.captionLabel='03'}
      if(src.endsWith('/aseptic-fill.webp')&&imageAttrs.caption){attrs.mediaSide='end';imageAttrs.captionLabel='04'}
      block.attrs=attrs
    }
    Object.values(block).forEach(visit)
  }
  visit(value.body)
}

export default defineMigration({
  async up(){
    const about=await DB.table('website_settings').where('setting_key','about').first()
    if(about){
      const value=json(about.value)
      restoreAboutLayout(value)
      await DB.table('website_settings').where('id',Number(about.id)).update({value:JSON.stringify(value)})
    }

    const sustainability=await DB.table('sustainability_articles').where('slug','local-sourcing').first()
    if(sustainability){
      const goals=await DB.table('sustainability_goals').whereIn('id',[2,8,12,13]).get()
      await DB.table('sustainability_article_goal').where('article_id',Number(sustainability.id)).delete()
      for(const [sortOrder,goalId] of [2,8,12,13].entries())if(goals.some(goal=>Number(goal.id)===goalId))await DB.table('sustainability_article_goal').insert({article_id:Number(sustainability.id),goal_id:goalId,sort_order:sortOrder})
    }

    const news=await DB.table('news_articles').where('slug','aseptic-line-commissioning-completed').first()
    if(news){
      const relatedSlugs=['haccp-and-iso-22000-audit-scheduled','alamir-ingredients-to-exhibit-at-gulfood','local-sourcing-programme-reaches-90-of-intake']
      const articles=await DB.table('news_articles').whereIn('slug',[...relatedSlugs,'local-sourcing-programme-reaches-90-of-intake']).get()
      const bySlug=new Map(articles.map(article=>[String(article.slug),Number(article.id)]))
      await DB.table('news_articles').where('id',Number(news.id)).update({previous_article_id:bySlug.get('local-sourcing-programme-reaches-90-of-intake')??null,next_article_id:bySlug.get('haccp-and-iso-22000-audit-scheduled')??null})
      await DB.table('news_article_related').where('article_id',Number(news.id)).delete()
      for(const [sortOrder,slug] of relatedSlugs.entries()){
        const relatedId=bySlug.get(slug)
        if(relatedId)await DB.table('news_article_related').insert({article_id:Number(news.id),related_article_id:relatedId,sort_order:sortOrder})
      }
    }
  },
  async down(){},
})
