import {ConcentrationRangeTranslationObserver} from '@/server/db/observers/ConcentrationRangeTranslationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('concentration_translations', {
  name: 'ConcentrationRangeTranslation',
  observers: [ConcentrationRangeTranslationObserver],
  fillable: ['concentration_id', 'locale', 'name'],
  relations: {owner: belongsTo('ConcentrationRange', 'concentration_id')},
})
