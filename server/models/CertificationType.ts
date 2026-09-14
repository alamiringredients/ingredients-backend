import {defineModel, hasMany} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'
import {CertificationTypeObserver} from '@/server/db/observers/CertificationTypeObserver'

const CertificationType = defineModel('certification_types', {
  fillable: ['slug', 'seed_key', 'kind', 'logo', 'badge'],
  observers: [CertificationTypeObserver],
  relations: {certifications: hasMany('Certification', 'type_id'), translations: hasMany('CertificationTypeTranslation', 'type_id')},
})
export default defineMediaModel(CertificationType, cmsMediaDefinition())
