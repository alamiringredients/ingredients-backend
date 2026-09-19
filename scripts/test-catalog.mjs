import {build} from 'esbuild'
import {mkdtemp,readdir,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
const directory=await mkdtemp(join(process.cwd(),'.catalog-test-'))
try {
  const outfile=join(directory,'catalog.test.mjs')
  const testFile=process.argv[2] ?? 'tests/catalog.test.tsx'
  const models=(await readdir(join(process.cwd(),'server/models'))).filter(file=>file.endsWith('.ts')).map(file=>`import './server/models/${file}'`).join(';')
  await build({stdin:{contents:`import './.holo-js/generated/schema.generated.ts'; ${models}; import ${JSON.stringify(`./${testFile}`)}`,resolveDir:process.cwd(),sourcefile:'holo-test-entry.ts'},outfile,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',plugins:[{name:'render-test-boundaries',setup(build){
    build.onResolve({filter:/^@alamir\/forms\//},args=>({path:join(process.cwd(),'node_modules',args.path+'.ts')}))
    build.onResolve({filter:/^next\/navigation$/},()=>({path:'next/navigation',namespace:'next-navigation'}))
    build.onLoad({filter:/.*/,namespace:'next-navigation'},()=>({contents:"export const useRouter=()=>({replace(){},refresh(){}}); export const usePathname=()=>'/admin'; export const redirect=()=>{};"}))
    build.onResolve({filter:/^next\/link$/},()=>({path:'next/link',namespace:'next-link'}))
    build.onLoad({filter:/.*/,namespace:'next-link'},()=>({contents:"import link from 'next/link.js'; export default link.default;",resolveDir:process.cwd()}))
    build.onResolve({filter:/^next\/image$/},()=>({path:'next/image',namespace:'next-image'}))
    build.onLoad({filter:/.*/,namespace:'next-image'},()=>({contents:"import image from 'next/image.js'; export default image.default;",resolveDir:process.cwd()}))
    build.onResolve({filter:/^@\/components\/site\/(smart-link|content-image)$/},args=>({path:args.path,namespace:'ui'}))
    build.onLoad({filter:/.*/,namespace:'ui'},()=>({contents:"import {createElement} from 'react'; export const SmartLink=props=>createElement('a',props); export const ContentImage=({preload,...props})=>createElement('img',props);",resolveDir:process.cwd()}))
    build.onResolve({filter:/^server-only$/},()=>({path:'server-only',namespace:'empty'}))
    build.onLoad({filter:/.*/,namespace:'empty'},()=>({contents:'export {}'}))
  }}]})
  const result=spawnSync(process.execPath,['--test',outfile],{stdio:'inherit'})
  process.exitCode=result.status ?? 1
} finally {await rm(directory,{recursive:true,force:true})}
