import assert from 'node:assert/strict'
import {test} from 'node:test'
import {safeParse} from '@holo-js/forms'
import {createAdminForm,roleForm,updateAdminForm} from '../app/admin/access-schema'
import {categoryForm,productForm} from '../app/admin/catalog-schema'
import {eventForm} from '../server/http/controllers/event-schema'
import {translationsForm} from '../app/admin/translation-schema'

test('access schemas validate their own fields',async()=>{
  const admin=await safeParse({name:'',email:'bad',password:'short',role_id:0},createAdminForm)
  assert.equal(admin.valid,false)
  if(!admin.valid)for(const name of ['name','email','password','role_id'])assert.ok(admin.errors.has(name))
  assert.equal((await safeParse({name:'Editor',email:'editor@example.com',password:'',role_id:1},updateAdminForm)).valid,true)
  assert.equal((await safeParse({name:'Editor',description:''},roleForm)).valid,true)
})

test('catalog schemas keep product and category requirements explicit',async()=>{
  const common={slug:'orange-concentrate',published:false,sort_order:0}
  assert.equal((await safeParse(common,categoryForm)).valid,true)
  const product=await safeParse({...common,category_id:0},productForm)
  assert.equal(product.valid,false)
  if(!product.valid)assert.ok(product.errors.has('category_id'))
})

test('event schema rejects malformed dates and time zones',async()=>{
  const result=await safeParse({slug:'event',kind:'event',published:false,sort_order:0,starts_at:'bad',ends_at:'bad',timezone:'bad'},eventForm)
  assert.equal(result.valid,false)
  if(!result.valid)for(const name of ['starts_at','ends_at','timezone'])assert.ok(result.errors.has(name))
})

test('translation schema reports nested field errors',async()=>{
  const result=await safeParse({translations:[{key:'home.title',locale:'ar',value:''}]},translationsForm)
  assert.equal(result.valid,false)
  if(!result.valid)assert.ok(result.errors.has('translations.0.value'))
})
