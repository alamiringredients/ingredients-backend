import assert from 'node:assert/strict'
import {test} from 'node:test'
import {validate,isValidationException} from '@holo-js/forms'
import {homeFigures} from '../app/admin/cms-schema'
import {migrateHomeFigures} from '../server/db/seed-data/home-figures'
import {getHomePageSeedContent} from '../server/db/seeders/HomePageSeeder'
import type {HomeSectionContent} from '../lib/cms/contracts'

const localized=(en:string)=>({en,ar:`ar ${en}`,fr:`fr ${en}`})

test('existing figures retain edited numbers and translations as independent repeater items',()=>{
  const sources=['Exported / year','Imported / year','Group-wide','MT','Al Amir Group — in figures']
  const section:HomeSectionContent={key:'figures',label:'Key figures',enabled:true,assets:[],links:[],
    stats:[{id:'exported-yearly',label:'Exported',value:175},{id:'imported-yearly',label:'Imported',value:90}],
    texts:sources.map(source=>({id:source,label:source,source,values:localized(source)})),
  }
  const migrated=migrateHomeFigures(section)
  assert.deepEqual(migrated.figures?.map(item=>[item.value,item.unit,item.unitLabel.en,item.label.en,item.description.en]),[
    [175,'K','MT','Exported / year','Group-wide'],[90,'K','MT','Imported / year','Group-wide'],
  ])
  migrated.figures![0].description.en='Export operations'
  assert.equal(migrated.figures![1].description.en,'Group-wide')
  assert.equal(migrated.figures![0].label.ar,'ar Exported / year')
  assert.deepEqual(migrated.texts.map(field=>field.source),['Al Amir Group — in figures'])
  assert.equal('stats' in migrated,false)
  assert.deepEqual(migrateHomeFigures(migrated),migrated)
})

test('figure submissions preserve ordering, decimal numbers, custom units and independent localized text',async()=>{
  const figures=getHomePageSeedContent().sections.find(section=>section.key==='figures')!.figures!
  const added={id:'new-figure',value:12.5,unit:'%',unitLabel:{en:'',ar:'',fr:''},label:localized('Capacity'),description:localized('Additional capacity')}
  const submitted=[added,figures[3],figures[1]]
  assert.deepEqual((await validate({figures:submitted},homeFigures)).figures,submitted)
  assert.deepEqual((await validate({figures:[]},homeFigures)).figures,[])
})

test('invalid figures return errors for the specific repeater fields',async()=>{
  const figure=getHomePageSeedContent().sections.find(section=>section.key==='figures')!.figures![0]
  await assert.rejects(validate({figures:[{...figure,value:-1}]},homeFigures),error=>isValidationException(error)&&'figures.0.value' in error.errors.flatten())
  await assert.rejects(validate({figures:[{...figure,value:null}]},homeFigures))
  await assert.rejects(validate({figures:[{...figure,label:{en:'',ar:'',fr:''}}]},homeFigures))
  await assert.rejects(validate({figures:[figure,figure]},homeFigures))
})
