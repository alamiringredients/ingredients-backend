'use client'

import {CatalogButton} from '@/components/admin/catalog-button'
import {useEffect,useId,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import Image from 'next/image'
import {getEditorMedia} from '@/app/admin/media-actions'
import {EditorIcon} from './editor-icon'
import './editor.css'

type MediaPage=Awaited<ReturnType<typeof getEditorMedia>>
function MediaPreview({item}:{item:MediaPage['items'][number]}) {
  const [failed,setFailed]=useState(false)
  if(failed)return <div className="editor-media-unavailable"><EditorIcon name={item.kind}/><small>Preview unavailable</small></div>
  return item.kind==='image'?<Image src={item.url} alt="" width={240} height={180} unoptimized onError={()=>setFailed(true)}/>:<video src={item.url} muted preload="metadata" onError={()=>setFailed(true)}/>
}
export function MediaPicker({kind,onSelect,className,disabled=false}:{kind:'image'|'video';onSelect:(url:string)=>void;className?:string;disabled?:boolean}) {
  const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[page,setPage]=useState<MediaPage>({items:[],next:null}),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const dialog=useRef<HTMLDialogElement>(null),request=useRef(0)
  const title=useId()
  useEffect(()=>{if(open)dialog.current?.showModal()},[open])
  useEffect(()=>{
    if(!open)return
    const current=++request.current
    const timer=setTimeout(()=>{
      setBusy(true);setError('')
      getEditorMedia(kind,search).then(result=>{if(request.current===current)setPage(result)}).catch(()=>{if(request.current===current)setError('Could not load media. Try opening the library again.')}).finally(()=>{if(request.current===current)setBusy(false)})
    },200)
    return()=>{clearTimeout(timer);request.current++}
  },[kind,search,open])
  const close=()=>dialog.current?.close()
  const more=async()=>{
    if(!page.next||busy)return
    const current=request.current
    setBusy(true);setError('')
    try{const result=await getEditorMedia(kind,search,page.next);if(current===request.current)setPage(p=>({items:[...p.items,...result.items],next:result.next}))}catch{if(current===request.current)setError('Could not load more media. Please try again.')}finally{if(current===request.current)setBusy(false)}
  }
  return <><CatalogButton className={className} disabled={disabled} onClick={()=>{setPage({items:[],next:null});setSearch('');setBusy(true);setOpen(true)}}><EditorIcon name="image"/>Media library</CatalogButton>
    {open&&createPortal(<dialog ref={dialog} className="editor-media-dialog" aria-labelledby={title} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}}} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)close()}}>
      <div className="editor-media-dialog-content">
        <header><div><h2 id={title}>Media library</h2><p>Choose {kind==='image'?'an image':'a video'} from uploads across the dashboard.</p></div><button type="button" onClick={close} aria-label="Close media library">×</button></header>
        <label className="editor-media-search">Search by filename<input type="search" value={search} onChange={e=>{setBusy(true);setSearch(e.target.value)}} placeholder="Search media…"/></label>
        <div className="editor-media-results" aria-busy={busy}>
          {error&&<p role="alert">{error}</p>}
          {!busy&&!error&&!page.items.length&&<p>No {kind==='image'?'images':'videos'} found.</p>}
          <div className="editor-media-grid">{page.items.map(item=><button type="button" key={item.id} onClick={()=>{onSelect(item.url);close()}} title={item.name}>
            <MediaPreview item={item}/><span>{item.name}</span>
          </button>)}</div>
          {busy&&<p role="status">Loading media…</p>}
          {page.next&&<button type="button" className="editor-media-more" disabled={busy} onClick={()=>void more()}>Load more</button>}
        </div>
      </div>
    </dialog>,document.body)}
  </>
}
