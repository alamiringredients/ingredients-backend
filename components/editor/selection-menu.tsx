'use client'

import {useEffect,useMemo,useRef,useState} from 'react'
import type {Editor} from '@tiptap/react'
import {BubbleMenu,type BubbleMenuProps} from '@tiptap/react/menus'
import {PluginKey,TextSelection} from '@tiptap/pm/state'
import {contentUrl} from '@/lib/editor/document'
import {EditorIcon} from './editor-icon'

const shouldShow:BubbleMenuProps['shouldShow']=({editor,state,view,element})=>editor.isEditable&&state.selection instanceof TextSelection&&!state.selection.empty&&Boolean(state.doc.textBetween(state.selection.from,state.selection.to).trim())&&(view.hasFocus()||element.contains(document.activeElement))

export function SelectionMenu({editor}:{editor:Editor}) {
  const [editingLink,setEditingLink]=useState(false)
  const [href,setHref]=useState('')
  const [error,setError]=useState('')
  const menu=useRef<HTMLDivElement>(null)
  const pluginKey=useMemo(()=>new PluginKey('selectionFormatting'),[])
  const options=useMemo<BubbleMenuProps['options']>(()=>({placement:'top',strategy:'fixed',offset:8,shift:{padding:12},flip:{padding:12},onHide:()=>{setEditingLink(false);setError('')}}),[])
  useEffect(()=>{
    const escape=(event:KeyboardEvent)=>{
      if(event.key!=='Escape'||!menu.current?.getClientRects().length)return
      event.preventDefault()
      setEditingLink(false)
      editor.chain().focus().setTextSelection(editor.state.selection.to).run()
    }
    document.addEventListener('keydown',escape)
    return()=>document.removeEventListener('keydown',escape)
  },[editor])
  useEffect(()=>{editor.commands.setMeta(pluginKey,'updatePosition')},[editor,pluginKey,editingLink,error])
  const applyLink=()=>{
    try {
      editor.chain().focus().extendMarkRange('link').setLink({href:contentUrl(href)}).run()
      setError('');setEditingLink(false)
    } catch(cause) {setError(cause instanceof Error?cause.message:'Invalid link')}
  }
  return <BubbleMenu ref={menu} editor={editor} pluginKey={pluginKey} updateDelay={0} className="editor-selection-menu" role="group" aria-label="Selected text formatting"
    shouldShow={shouldShow} options={options}>
    <div className="editor-selection-actions">
      <button type="button" aria-label="Bold" title="Bold" aria-pressed={editor.isActive('bold')} onMouseDown={e=>e.preventDefault()} onClick={()=>editor.chain().focus().toggleBold().run()}><EditorIcon name="bold"/></button>
      <button type="button" aria-label="Italic" title="Italic" aria-pressed={editor.isActive('italic')} onMouseDown={e=>e.preventDefault()} onClick={()=>editor.chain().focus().toggleItalic().run()}><EditorIcon name="italic"/></button>
      <button type="button" aria-label="Edit link" title="Edit link" aria-expanded={editingLink} aria-pressed={editor.isActive('link')} onClick={()=>{setHref(editor.getAttributes('link').href||'');setError('');setEditingLink(v=>!v)}}><EditorIcon name="link"/></button>
    </div>
    {editingLink&&<div className="editor-selection-link">
      <label>Link destination<input autoFocus value={href} onChange={e=>setHref(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();applyLink()}}}/></label>
      <div><button type="button" onClick={applyLink}>Apply</button><button type="button" onClick={()=>{editor.chain().focus().extendMarkRange('link').unsetLink().run();setEditingLink(false)}}>Remove link</button></div>
      {error&&<p role="alert">{error}</p>}
    </div>}
  </BubbleMenu>
}
