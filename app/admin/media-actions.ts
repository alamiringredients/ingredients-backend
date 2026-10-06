'use server'

import {requireAdminPermission} from '@/server/admin/authorization'
import {Media,MediaItem} from '@holo-js/media'

export async function getEditorMedia(kind:'image'|'video',search='',before?:number) {
  await requireAdminPermission('media', 'view')
  if(kind!=='image'&&kind!=='video')throw new Error('Invalid media type.')
  let query=Media.query().where('collection_name',kind==='image'?'images':'videos').orderBy('id','desc').limit(49)
  if(search.trim())query=query.where('file_name','like',`%${search.trim().slice(0,100).replace(/[\\%_]/g,'\\$&')}%`)
  if(before!==undefined){if(!Number.isSafeInteger(before)||before<1)throw new Error('Invalid page.');query=query.where('id','<',before)}
  const rows=await query.get()
  const page=rows.slice(0,48)
  // Holo's MediaItem constructor omits the Media model's morph relation in its entity type.
  return {items:page.map(row=>{const item=new MediaItem(row as unknown as ConstructorParameters<typeof MediaItem>[0]);return {id:Number(item.record.id),url:item.getUrl('optimized')||item.getUrl()||'',name:item.fileName,kind}}).filter(item=>item.url),next:rows.length>48?Number(page[page.length-1].id):null}
}
