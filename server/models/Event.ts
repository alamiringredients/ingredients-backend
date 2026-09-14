import {defineModel, hasMany} from '@holo-js/db'
import {EventObserver} from '@/server/db/observers/EventObserver'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'

const Event = defineModel('events', {
    relations: {slots: hasMany('EventSlot', 'event_id')},
    fillable: [
      'slug',
      'kind',
      'published',
      'sort_order',
      'starts_at',
      'ends_at',
      'timezone',
      'content',
    ],
    observers: [EventObserver],
})

export default defineMediaModel(Event, cmsMediaDefinition())
