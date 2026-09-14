import {HomeSectionObserver} from '@/server/db/observers/HomeSectionObserver'
import {defineModel} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'

const HomeSection = defineModel('home_sections', {
  observers: [HomeSectionObserver], fillable: ['section_key', 'label', 'enabled', 'sort_order', 'content'],
})

export default defineMediaModel(HomeSection, cmsMediaDefinition())
