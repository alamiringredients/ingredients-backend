import {CertificationTranslationObserver} from '@/server/db/observers/CertificationTranslationObserver'
import {belongsTo, defineModel} from '@holo-js/db'
export default defineModel('certification_translations', {
  observers: [CertificationTranslationObserver],
  fillable: ['certification_id', 'locale', 'scope'], relations: {certification: belongsTo('Certification', 'certification_id')},
})
