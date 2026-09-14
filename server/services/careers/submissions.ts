import 'server-only'
import {randomUUID} from 'node:crypto'
import {validateCvUpload} from '@/server/security/uploads'
import {Storage} from '@holo-js/storage/runtime'
import {ValidationException} from '@holo-js/forms'
import type {InferFormData} from '@holo-js/forms'
import CareerApplication from '@/server/models/CareerApplication'
import CareerJob from '@/server/models/CareerJob'
import type {careerApplicationForm} from '@/server/http/controllers/career-application-schema'
import {decode} from '@/server/services/careers/content'
import type {JobContent} from '@/lib/careers/contracts'
type CareerApplicationData=InferFormData<typeof careerApplicationForm>

export async function submitApplication(input:CareerApplicationData):Promise<{locale:'en'|'ar'|'fr'}>{
 const {locale,name,email,phone,letter='',department='',key,jobId:requestedJobId,cv:file,website}=input
 if(website)return {locale}
 const prior=await CareerApplication.where('submission_key',key).select('id','email').firstJson()
 if(prior){if(prior.email!==email)throw new ValidationException({key:['invalid']});return {locale}}
 const recent=await CareerApplication.where('email',email).where('created_at','>',new Date(Date.now()-3600000)).count()
 if(recent>=3)throw new ValidationException({_root:['rate']})
 const id=requestedJobId??0
 let title='',jobId:number|null=null
 if(id){
  const job=await CareerJob.find(id)
  if(!job||job.status!=='open')throw new ValidationException({_root:['closed']})
  title=decode<JobContent>(job.content)[locale as keyof JobContent].title;jobId=id
 }
 let upload:Awaited<ReturnType<typeof validateCvUpload>>
 try{upload=await validateCvUpload(file)}catch{throw new ValidationException({cv:['file']})}
 const {bytes,extension}=upload
 const path=`${randomUUID()}.${extension}`,disk=Storage.disk('applications')
 try{
  if(!await disk.put(path,bytes))throw new Error('Upload failed')
  await CareerApplication.create({...(jobId?{job_id:jobId}:{}),job_title:title,name,email,phone,department,letter,locale,status:'pending',cv_path:path,cv_name:(file.name??'cv').replace(/[\r\n\\/]/g,'_').slice(-200),submission_key:key})
  return {locale}
 }catch{
  await disk.delete(path)
  const saved=await CareerApplication.where('submission_key',key).firstJson()
  if(saved?.email===email)return {locale}
  throw new ValidationException({_root:['failed']})
 }
}
