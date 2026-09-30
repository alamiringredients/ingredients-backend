import {DB,defineMigration} from '@holo-js/db'
import {removeInternalNavigationLinks} from '@/lib/cms/navigation-links'

export default defineMigration({
  async up(){
    const columns=[['home_sections','content'],['website_settings','value'],['product_category_translations','content'],['product_translations','content']] as const
    for(const [table,column] of columns){
      const rows=await DB.table(table).select('id',column).get()
      for(const row of rows){
        const content=typeof row[column]==='string'?JSON.parse(row[column]):row[column]
        const cleaned=removeInternalNavigationLinks(content)
        if(JSON.stringify(cleaned)!==JSON.stringify(content))await DB.table(table).where('id',Number(row.id)).update({[column]:JSON.stringify(cleaned)})
      }
    }
  },
  async down(){},
})
