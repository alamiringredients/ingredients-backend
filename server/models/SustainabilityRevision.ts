import {belongsTo} from '@holo-js/db'
import {defineModel} from '@holo-js/db'
export default defineModel('sustainability_revisions',{relations: {article: belongsTo('SustainabilityArticle', 'article_id')}, fillable:['article_id','revision','content']})
