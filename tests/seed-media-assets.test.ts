import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'
import source from '../server/db/seed-data/site-content.json'

function assetUrls(value:unknown,urls=new Set<string>()):Set<string>{
  if(Array.isArray(value))value.forEach(item=>assetUrls(item,urls))
  else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value)){
    if((key==='src'||key==='poster')&&typeof item==='string'&&item.startsWith('/assets/'))urls.add(item)
    assetUrls(item,urls)
  }
  return urls
}

test('all seeded local media resolves and uploaded videos use WebM',()=>{
  const publicDirectory=fileURLToPath(new URL('../public',import.meta.url))
  for(const url of assetUrls(source)){
    assert.ok(existsSync(`${publicDirectory}${url}`),`Missing seeded asset: ${url}`)
    assert.ok(!url.endsWith('.mp4'),`Seeded video must use WebM: ${url}`)
  }
})
