import {collection, conversion} from '@holo-js/media'

const megabyte = 1024 * 1024

export function cmsMediaDefinition({artwork = false}: {artwork?: boolean} = {}) {
  return {
    collections: [
      collection('images')
        .acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
        .maxSize(20 * megabyte),
      collection('files')
        .acceptsMimeTypes(['image/x-icon', 'image/vnd.microsoft.icon', 'application/pdf'])
        .maxSize(10 * megabyte),
      collection('videos')
        .acceptsMimeTypes(['video/webm', 'video/mp4'])
        .maxSize(100 * megabyte),
    ],
    conversions: [
      conversion('optimized')
        .performOnCollections('images')
        .width(1920)
        .height(1920)
        .fit('inside')
        .format('webp')
        .quality(82)
        .nonQueued(),
      conversion('gallery')
        .performOnCollections('images')
        .width(1600)
        .height(1200)
        .fit('cover')
        .format('webp')
        .quality(82)
        .nonQueued(),
      ...(artwork ? [conversion('artwork')
        .performOnCollections('images')
        .width(300)
        .height(300)
        .fit('inside')
        .format('webp')
        .quality(82)
        .nonQueued()] : []),
    ],
  } as const
}
