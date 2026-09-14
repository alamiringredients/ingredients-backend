import 'server-only'
import {countQuery, paginateQuery} from '@/server/admin/crud-query'
import {DB} from '@holo-js/db'
import type {ListSearchParams,SubmissionPagination} from '@/lib/admin/submission-list'

export async function getSubmissionList(kind:'applications'|'enquiries',params:ListSearchParams){
  const application=kind==='applications'
  const table=application?'career_applications':'contact_enquiries'
  const statuses=application?['pending','accepted','declined']:['open','closed']
  const value=(key:string)=>typeof params[key]==='string'?params[key]:''
  const query=value('q').trim().slice(0,200)
  const status=statuses.includes(value('status'))?value('status'):''
  const source=!application&&['contact','quote'].includes(value('source'))?value('source'):''
  const requestedPage=Number(value('page'))
  const page=Number.isSafeInteger(requestedPage)&&requestedPage>0?requestedPage:1
  const columns=application?['id','name','email','job_title','department','status','created_at']:['id','name','email','company','product','source','status','created_at']
  let rows=DB.table(table).select(...columns).orderBy('id','desc')
  if(status)rows=rows.where('status',status)
  if(source)rows=rows.where('source',source)
  if(query){
    const pattern=`%${query.replace(/[\\%_]/g,'\\$&')}%`
    rows=rows.where(group=>{
      const match=group.where('name','like',pattern).orWhere('email','like',pattern)
      return application?match.orWhere('job_title','like',pattern).orWhere('department','like',pattern)
        :match.orWhere('company','like',pattern).orWhere('product','like',pattern)
    })
  }
  const [result,counts]=await Promise.all([
    paginateQuery(rows,page,value('perPage')),
    Promise.all(statuses.map(status=>countQuery(DB.table(table).where('status',status)))),
  ])
  const pagination:SubmissionPagination={meta:result.meta,query,filters:application?{status}:{status,source}}
  return {records:JSON.parse(JSON.stringify(result.data)),pagination,counts:Object.fromEntries(statuses.map((status,index)=>[status,counts[index]]))}
}
