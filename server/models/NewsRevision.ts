import {belongsTo} from '@holo-js/db'
import {defineModel} from '@holo-js/db'
export default defineModel('news_revisions',{relations: {article: belongsTo('NewsArticle', 'article_id')}, fillable:['article_id','revision','content']})
