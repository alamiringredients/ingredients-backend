import {requireAdminPermission} from '@/server/admin/authorization'
import CareerApplication from '@/server/models/CareerApplication'
import {Storage} from '@holo-js/storage/runtime'
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{await requireAdminPermission('career_applications','view')}catch{return new Response('Unauthorized',{status:403})}
 const {id}=await params
 if(!/^\d+$/.test(id))return new Response(null,{status:404})
 const row=await CareerApplication.find(Number(id));if(!row)return new Response(null,{status:404})
 const bytes=await Storage.disk('applications').getBytes(row.cv_path);if(!bytes)return new Response(null,{status:404})
 return new Response(Buffer.from(bytes),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(row.cv_name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
}
