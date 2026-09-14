import {belongsTo, defineModel, hasMany} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'
import {CertificationObserver} from '@/server/db/observers/CertificationObserver'

const Certification = defineModel('certifications', {
  fillable: ['type_id', 'seed_key', 'holder', 'status', 'published', 'sort_order', 'target_date', 'issue_date', 'expiry_date', 'certificate_number', 'document'],
  observers: [CertificationObserver],
  relations: {type: belongsTo('CertificationType', 'type_id'), translations: hasMany('CertificationTranslation', 'certification_id')},
})
export default defineMediaModel(Certification, cmsMediaDefinition())
