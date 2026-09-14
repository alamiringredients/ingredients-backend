import {CareerJobObserver} from '@/server/db/observers/CareerJobObserver'
import {defineModel, hasMany} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'

const CareerJob = defineModel('career_jobs', {
    relations: {applications: hasMany('CareerApplication', 'job_id')},
    observers: [CareerJobObserver],
    fillable: ['slug', 'code', 'status', 'content'],
})

export default defineMediaModel(CareerJob, cmsMediaDefinition())
