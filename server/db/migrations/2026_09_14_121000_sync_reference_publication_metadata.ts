import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>
const json=(value:unknown)=>(typeof value==='string'?JSON.parse(value):value) as Json

export default defineMigration({
  async up(){
    const sustainability=await DB.table('sustainability_articles').where('slug','local-sourcing').first()
    if(sustainability){
      for(const publication of await DB.table('sustainability_publications').where('article_id',Number(sustainability.id)).get()){
        const metadata=json(publication.metadata)
        metadata.goalIds=[2,8,12,13]
        await DB.table('sustainability_publications').where('id',Number(publication.id)).update({metadata:JSON.stringify(metadata)})
      }
    }

    const news=await DB.table('news_articles').where('slug','aseptic-line-commissioning-completed').first()
    if(news){
      for(const publication of await DB.table('news_publications').where('article_id',Number(news.id)).get()){
        const metadata=json(publication.metadata)
        metadata.previousSlug='local-sourcing-programme-reaches-90-of-intake'
        metadata.nextSlug='haccp-and-iso-22000-audit-scheduled'
        metadata.relatedSlugs=['haccp-and-iso-22000-audit-scheduled','alamir-ingredients-to-exhibit-at-gulfood','local-sourcing-programme-reaches-90-of-intake']
        await DB.table('news_publications').where('id',Number(publication.id)).update({metadata:JSON.stringify(metadata)})
      }
    }
  },
  async down(){},
})
