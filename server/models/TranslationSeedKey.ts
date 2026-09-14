import {defineModel} from '@holo-js/db'

// Kept after a translation is removed so repeat seeds respect that deletion.
const TranslationSeedKey = defineModel('translation_seed_keys', {fillable: ['translation_key']})

export default TranslationSeedKey
