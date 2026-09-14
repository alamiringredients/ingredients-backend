import {DB,defineMigration} from '@holo-js/db'

type Json=Record<string,unknown>

export default defineMigration({
  async up(){
    const product=await DB.table('products').where('slug','cold-break').first()
    if(!product)return
    const translations=await DB.table('product_translations').where('product_id',Number(product.id)).get()
    for(const translation of translations){
      const content=(typeof translation.content==='string'?JSON.parse(translation.content):translation.content) as Json
      const page=content.page as Json|undefined
      if(!Array.isArray(page?.blocks))continue
      for(const block of page.blocks as Json[]){
        if(block.key==='section-1'&&Array.isArray(block.texts))block.texts=(block.texts as Json[]).filter(text=>!(text.id==='text-3'&&text.source==='Cold Break concentrate'))
      }
      await DB.table('product_translations').where('id',Number(translation.id)).update({content:JSON.stringify(content)})
    }
  },
  async down(){},
})
