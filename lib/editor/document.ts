/** Portable, branded content. No font, arbitrary CSS, or raw HTML is persisted. */
export type ContentNode = {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: {type: string; attrs?: Record<string, unknown>}[]
  content?: ContentNode[]
}
export type ContentDocument = ContentNode & {type: 'doc'; content: ContentNode[]}
export const emptyDocument = (): ContentDocument => ({type:'doc',content:[{type:'paragraph'}]})
export const textContent = (node: ContentNode): string => node.text ?? (node.content ?? []).map(textContent).join('')
export function documentHeadings(doc: ContentNode): {id:string; text:string; level:number}[] {
  const found: {id:string; text:string; level:number}[] = []
  const visit = (node: ContentNode,visible=true) => {
    const shown=visible&&node.attrs?.visible!==false
    if (shown&&node.type === 'heading' && node.attrs?.id && !node.attrs.hideFromContents) found.push({id:String(node.attrs.id),text:textContent(node),level:Number(node.attrs.level)})
    node.content?.forEach(child=>visit(child,shown))
  }
  visit(doc)
  return found
}
export function contentUrl(value: unknown, media = false): string {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Invalid URL.')
  if (!value) return ''
  if ([...value].some(char=>char.charCodeAt(0)<=32||char==='\\')) throw new Error('URLs cannot contain spaces or control characters.')
  if (/^\/(?!\/)/.test(value) || (!media && /^#[\w-]+$/.test(value))) return value
  if (/^https?:\/\//i.test(value)) {new URL(value);return value}
  if (!media && /^(mailto:|tel:)/i.test(value)) return value
  // Media can use the configured storage URL; embeds have a separate provider allowlist.
  throw new Error(media ? 'Choose an image or video from this site’s media library.' : 'Use a website, email, telephone, or internal link.')
}
function embedUrl(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:') throw new Error('Embed URLs must use HTTPS.')
  if (['youtube.com','www.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(url.hostname)) {
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') ?? url.pathname.split('/').at(-1)
    if (!id || !/^[\w-]{11}$/.test(id)) throw new Error('Use a valid YouTube video URL.')
    return `https://www.youtube-nocookie.com/embed/${id}`
  }
  if (['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(url.hostname)) {
    const id = url.pathname.split('/').at(-1)
    if (!id || !/^\d+$/.test(id)) throw new Error('Use a public Vimeo video URL.')
    return `https://player.vimeo.com/video/${id}`
  }
  throw new Error('Supported embeds are YouTube and public Vimeo videos.')
}
const types = new Set(['doc','text','paragraph','heading','bulletList','orderedList','listItem','blockquote','hardBreak','horizontalRule','image','gallery','facts','textStatistics','columns','column','video','callout','contentSection','dataTable','sectionHeader','actions','aboutProfile','valuesRail','certificationPanel','mediaCards','pillars'])
const inline = new Set(['text','hardBreak'])
const string = (value: unknown, max=2000) => {if (typeof value !== 'string' || value.length > max) throw new Error('Invalid content text.'); return value}
const choice = <T extends string>(value: unknown, choices: readonly T[], fallback:T):T => {if (value === undefined) return fallback; if (!choices.includes(value as T)) throw new Error('Unsupported content option.'); return value as T}
export function validateDocument(input: unknown): ContentDocument {
  let count = 0
  const ids = new Set<string>()
  const visit = (value: unknown, depth: number, parent?:string):ContentNode => {
    if (++count > 5000 || depth > 12 || !value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Document is too complex or invalid.')
    const n = value as ContentNode
    if (!types.has(n.type)) throw new Error(`Unsupported block: ${n.type}`)
    if (parent === 'heading' || parent === 'paragraph') {if (!inline.has(n.type)) throw new Error('Headings and paragraphs may only contain text.')}
    else if (parent === 'bulletList' || parent === 'orderedList') {if (n.type !== 'listItem') throw new Error('Invalid list.')}
    else if (parent === 'columns') {if (n.type !== 'column') throw new Error('Invalid columns.')}
    else if (parent && (inline.has(n.type) || ['doc','column','listItem'].includes(n.type))) throw new Error('Invalid block nesting.')
    const out:ContentNode = {type:n.type}
    const a = n.attrs ?? {}
    if (n.type === 'text') {
      out.text = string(n.text,50000)
      if (n.marks) out.marks = n.marks.map(mark => {
        if (!['bold','italic','underline','link'].includes(mark.type)) throw new Error('Only approved text styles are allowed.')
        return mark.type === 'link' ? {type:'link',attrs:{href:contentUrl(mark.attrs?.href)}} : {type:mark.type}
      })
    }
    if (n.content) {
      if (!Array.isArray(n.content) || ['text','image','gallery','facts','video','dataTable','hardBreak','horizontalRule'].includes(n.type)) throw new Error('Invalid block content.')
      out.content = n.content.map(child=>visit(child,depth+1,n.type))
    }
    if(n.type==='contentSection'){
      if(typeof a.id!=='string'||!/^[\w-]{1,100}$/.test(a.id)||!Array.isArray(a.goals)||a.goals.some(g=>!Number.isSafeInteger(g)||Number(g)<1))throw new Error('Invalid section anchor or goals.')
      out.attrs={id:a.id,goals:[...new Set(a.goals)],theme:choice(a.theme,['plain','tint','navy'],'plain')}
    }
    if(n.type==='dataTable'){
      if(!Array.isArray(a.headers)||a.headers.length<1||a.headers.length>6||!Array.isArray(a.rows)||a.rows.length>30)throw new Error('Tables support up to six columns and thirty rows.')
      out.attrs={statusColumn:Boolean(a.statusColumn),caption:string(a.caption??''),headers:a.headers.map(h=>string(h)),rows:a.rows.map(row=>{if(!Array.isArray(row)||row.length!==(a.headers as unknown[]).length)throw new Error('Every table row must match its columns.');return row.map(cell=>string(cell))})}
    }
    if (n.type === 'heading') {
      let id = typeof a.id === 'string' && /^[\w-]{1,100}$/.test(a.id) ? a.id : `section-${count}`
      while (ids.has(id)) id += '-2'
      ids.add(id)
      out.attrs = {id,level:a.level === 3 ? 3 : 2,hideFromContents:Boolean(a.hideFromContents)}
    }
    if (n.type === 'paragraph') out.attrs = {variant:choice(a.variant,['body','lead'],'body')}
    if (n.type === 'blockquote') out.attrs = {citation:string(a.citation ?? '')}
    if (n.type === 'image') out.attrs = {captionLabel:string(a.captionLabel??''),src:contentUrl(a.src ?? '',true),alt:string(a.alt ?? ''),caption:string(a.caption ?? ''),captionPosition:choice(a.captionPosition,['above','below'],'below'),ratio:choice(a.ratio,['original','4/3','16/9','1/1'],'original'),position:choice(a.position,['center','top','bottom'],'center')}
    if (n.type === 'gallery') {
      if (!Array.isArray(a.images) || a.images.length > 12) throw new Error('Choose up to twelve gallery images.')
      out.attrs = {images:a.images.map(image=>{const i=image as Record<string,unknown>;return {src:contentUrl(i.src ?? '',true),alt:string(i.alt ?? '')}}),caption:string(a.caption ?? ''),captionPosition:choice(a.captionPosition,['above','below'],'below')}
    }
    if (n.type === 'facts' || n.type === 'textStatistics') {
      if (!Array.isArray(a.items) || a.items.length > 20) throw new Error('Use up to twenty rows.')
      out.attrs = {label:string(a.label ?? ''),items:a.items.map(item=>{const i=item as Record<string,unknown>;return {value:string(i.value ?? ''),label:string(i.label ?? '')}}),...(n.type==='textStatistics'?{useGroupLogo:a.useGroupLogo===true,markSrc:a.useGroupLogo===true?'':contentUrl(a.markSrc??'',true),markAlt:string(a.markAlt??''),markHref:a.markHref?contentUrl(a.markHref):''}:{})}
    }
    if (n.type === 'columns') {
      if (!out.content || out.content.length < 2 || out.content.length > 3) throw new Error('Layouts need two or three columns.')
      out.attrs = {layout:choice(a.layout,['equal','wide-start','wide-end','prose-media'],'equal'),verticalAlign:choice(a.verticalAlign,['start','center','end','stretch'],'start'),mediaSide:choice(a.mediaSide,['start','end'],'start')}
    }
    if (n.type === 'video') {
      const source = choice(a.source,['upload','embed'],'upload')
      const src = string(a.src ?? '')
      const mode=choice(a.mode,['player','silent','background'],'player'),automatic=mode!=='player'
      out.attrs = {source,src:source === 'embed' && src ? embedUrl(src) : contentUrl(src,true),mode,autoplay:a.autoplay===undefined?automatic:Boolean(a.autoplay),loop:a.loop===undefined?automatic:Boolean(a.loop),muted:a.muted===undefined?automatic:Boolean(a.muted),controls:a.controls===undefined?!automatic:Boolean(a.controls),poster:contentUrl(a.poster ?? '',true),caption:string(a.caption ?? ''),captionPosition:choice(a.captionPosition,['above','below'],'below'),captionStyle:choice(a.captionStyle,['plain','ledger'],'plain'),label:string(a.label ?? ''),ratio:choice(a.ratio,['16/9','4/3','1/1'],'16/9')}
      if (source === 'embed') out.attrs.mode = 'player'
    }
    if(n.type==='sectionHeader')out.attrs={eyebrow:string(a.eyebrow??''),width:choice(a.width,['measure','wide'],'measure'),layout:choice(a.layout,['stacked','split'],'stacked'),singleLine:Boolean(a.singleLine),ctaLabel:string(a.ctaLabel??''),ctaHref:a.ctaHref?contentUrl(a.ctaHref):''}
    if(n.type==='actions'){
      if(!Array.isArray(a.items)||a.items.length>6)throw new Error('Action groups support up to six links.')
      out.attrs={items:a.items.map(item=>{const value=item as Record<string,unknown>;return {label:string(value.label??''),href:value.href?contentUrl(value.href):'',variant:choice(value.variant,['primary','secondary'],'primary'),visible:value.visible===undefined?true:Boolean(value.visible)}})}
    }
    if(n.type==='aboutProfile')out.attrs={image:contentUrl(a.image??'',true),alt:string(a.alt??''),storyLabel:string(a.storyLabel??''),story:string(a.story??'',5000),visionLabel:string(a.visionLabel??''),vision:string(a.vision??'',5000),missionLabel:string(a.missionLabel??''),mission:string(a.mission??'',5000)}
    if(n.type==='valuesRail'||n.type==='mediaCards'){
      if(!Array.isArray(a.items)||a.items.length>12)throw new Error('Values sections support up to twelve cards.')
      out.attrs={items:a.items.map(item=>{const value=item as Record<string,unknown>;return {image:contentUrl(value.image??'',true),alt:string(value.alt??''),title:string(value.title??''),description:string(value.description??'',5000)}})}
    }
    if(n.type==='certificationPanel')out.attrs={holder:choice(a.holder,['group','sadat-city'],'group')}
    if(n.type==='pillars'){
      if(!Array.isArray(a.items)||a.items.length>8)throw new Error('Pillar sections support up to eight items.')
      out.attrs={items:a.items.map(item=>string(item))}
    }
    if (n.type === 'callout') out.attrs = {variant:choice(a.variant,['accent','soft'],'accent')}
    if (!['doc','text','column','listItem','hardBreak'].includes(n.type)) out.attrs={...out.attrs,visible:a.visible===undefined?true:Boolean(a.visible)}
    return out
  }
  const doc = visit(input,0)
  if (doc.type !== 'doc' || !doc.content) throw new Error('A document is required.')
  return doc as ContentDocument
}
