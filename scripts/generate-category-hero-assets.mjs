import {mkdir} from 'node:fs/promises'
import {dirname,join} from 'node:path'
import sharp from 'sharp'

const root=process.cwd()
const width=1420
const height=1000
const categories={
  'tomato-concentrates':[
    {src:'assets/magnific_a-single-whole-ripe-red-t_62NLzMIiJO-1.webp',width:50,left:25,top:0,z:1},
    {src:'assets/magnific_a-single-whole-ripe-red-t_74wb6zlJAL-1.webp',width:45,right:3,top:30,z:1},
    {src:'assets/magnific_a-ripe-red-tomato-cut-cle_SOgF48FUb8-2.webp',width:37,left:4,top:38,z:2},
  ],
  'fruit-concentrates':[
    {src:'assets/fruit-concentrates/magnific_a-single-whole-ripe-red-a_ohBzEoy829-2.webp',width:47.8,left:52.1,bottom:17.5,z:1},
    {src:'assets/fruit-concentrates/magnific_a-single-whole-ripe-mango_Kj5tlhZkqp-2.webp',width:63.9,left:0,bottom:11.8,z:2},
    {src:'assets/fruit-concentrates/magnific_a-single-whole-ripe-paleg_NZ9jzkk6D9-2.webp',width:45,left:27.5,bottom:1.5,z:3},
    {src:'assets/fruit-concentrates/magnific_a-single-whole-ripe-red-s_nTzOphrYQD-2.webp',width:34.3,left:13.2,bottom:3.5,z:4},
    {src:'assets/fruit-concentrates/magnific_a-single-whole-ripe-orang_9R4xzEENYZ-2.webp',width:29.6,left:64.5,bottom:10.1,z:5},
  ],
  'fruit-purees':[
    {src:'assets/fruit-purees/magnific_studio-product-photograph_LwlMVUSswO-1.webp',width:51.4,left:19.4,bottom:38.5,z:1},
    {src:'assets/fruit-purees/magnific_studio-product-photograph_nVW5qJEYQD-1.webp',width:54,left:46,bottom:1.6,z:2},
    {src:'assets/fruit-purees/magnific_studio-product-photograph_cpT11XU0eP-1.webp',width:47.2,left:0,bottom:3.7,z:3},
  ],
}

for (const [slug,layers] of Object.entries(categories)) {
  const composites=[]
  for (const layer of layers.sort((a,b)=>a.z-b.z)) {
    const layerWidth=Math.round(width*layer.width/100)
    const input=await sharp(join(root,'public',layer.src)).resize({width:layerWidth}).webp({quality:92}).toBuffer({resolveWithObject:true})
    const left=Math.round(width*((layer.left??(100-layer.width-(layer.right??0)))/100))
    const top=layer.top===undefined?Math.round(height*(1-(layer.bottom??0)/100)-input.info.height):Math.round(height*layer.top/100)
    composites.push({input:input.data,left,top})
  }
  const output=join(root,'public','assets','categories',`${slug}-hero.webp`)
  await mkdir(dirname(output),{recursive:true})
  await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).webp({quality:90,alphaQuality:100}).toFile(output)
  console.log(`Generated ${output}`)
}
