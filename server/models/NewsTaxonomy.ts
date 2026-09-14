import {NewsTaxonomyObserver} from '@/server/db/observers/NewsTaxonomyObserver'
import {defineModel} from '@holo-js/db'
export default defineModel('news_taxonomies',{observers:[NewsTaxonomyObserver],fillable:['kind','slug','sort_order','content']})
