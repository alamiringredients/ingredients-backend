'use client'
import { AdminForm } from './admin-form'
import { AdminPageHeader } from './admin-page-header'
import { CatalogButton,CatalogButtonLink,CatalogIconButton } from './catalog-button'

import { CatalogField,CatalogFormGrid,CatalogFormMain,CatalogFormSidebar } from './catalog-layout'
import { CatalogPanel } from './catalog-panel'

import { emptyDocument,textContent } from '@/lib/editor/document'
import { LocalizedEditor } from './localized-editor'

import { saveCatalogRecord } from '@/app/admin/catalog-actions'
import type { AdminCapabilities } from '@/lib/admin/access'
import type { Catalog,CatalogBlock,CatalogItem,Category,Product,ProductGalleryItem } from '@/lib/catalog/contracts'
import { categoryPath,emptyLocalized,MAX_CATEGORY_ARTWORK_IMAGES,productPath } from '@/lib/catalog/contracts'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LocalizedPdfFields } from './catalog-fields'
import { AssetField,LocalizedFields,UrlField,type CmsMediaOwner } from './cms-fields'
import { ConfirmAction } from './confirm-action'
import { AdminFormProvider,FormNotice,useAdminForm,type AdminResult } from './form-feedback'

import { Icon } from './catalog-icon'

const hasValue=(item:CatalogItem)=>Object.values(item.value).some(Boolean)||Boolean(item.label&&Object.values(item.label).some(Boolean))
function sectionItems(block:CatalogBlock):CatalogItem[] {
  if (block.items) return block.items
  const fields=block.texts.filter(field=>field.source!==block.label&&field.source!=='See the document library →')
  if (block.label==='Technical specification') {
    const items:CatalogItem[]=[]
    for(let index=0;index<fields.length;index+=2) items.push({label:fields[index].values,value:fields[index+1]?.values??emptyLocalized()})
    return items.filter(hasValue)
  }
  return fields.map(field=>({value:field.values})).filter(hasValue)
}

function ProductSections({product,onChange}:{product:Product;onChange:(page:Product['content']['page'])=>void}) {
  const sections=product.content.page.blocks.filter(block=>block.key.startsWith('fold-'))
  if (!sections.length) return null
  const update=(block:CatalogBlock)=>onChange({...product.content.page,blocks:product.content.page.blocks.map(item=>item.key===block.key?block:item)})
  return <CatalogPanel title={<>Product sections</>} description={<>Optional product-specific content. Section titles come from Translations.</>} bodyClassName="catalog-section-list">
      {sections.map(block=>{
        const items=sectionItems(block)
        const specifications=block.label==='Technical specification'
        const setItems=(next:CatalogItem[])=>update({...block,items:next})
        const updateItem=(index:number,item:CatalogItem)=>setItems(items.map((current,currentIndex)=>currentIndex===index?item:current))
        const moveItem=(index:number,direction:-1|1)=>{const target=index+direction;if(target<0||target>=items.length)return;const next=[...items];[next[index],next[target]]=[next[target],next[index]];setItems(next)}
        return <details className="catalog-section" key={block.key} open={block.enabled}>
          <summary><span>{block.label}</span><span className={`catalog-section-state${block.enabled?' is-on':''}`}>{block.enabled?'Shown':'Hidden'}</span></summary>
          <div className="catalog-section-body">
            <label className="catalog-switch"><input type="checkbox" checked={block.enabled} onChange={event=>update({...block,enabled:event.target.checked})}/><span aria-hidden="true"/><b>Show this section</b></label>
            <div className="catalog-items">
              {items.map((item,index)=><div className="catalog-item" key={index}>
                <div className="catalog-item-head"><b>{specifications?'Specification':block.label==='Applications'?'Application':'Item'} {index+1}</b><div className="catalog-item-actions"><CatalogIconButton type="button" onClick={()=>moveItem(index,-1)} disabled={index===0} aria-label="Move up"><Icon name="up"/></CatalogIconButton><CatalogIconButton type="button" onClick={()=>moveItem(index,1)} disabled={index===items.length-1} aria-label="Move down"><Icon name="down"/></CatalogIconButton><ConfirmAction triggerClassName="is-delete" triggerLabel={`Delete item ${index+1}`} title={`Delete item ${index+1}?`} description="This item will be removed from the draft. Save your changes to make the deletion permanent." onConfirm={()=>setItems(items.filter((_,current)=>current!==index))}><Icon name="delete"/></ConfirmAction></div></div>
                {specifications&&<LocalizedFields label="Label" value={item.label??emptyLocalized()} onChange={label=>updateItem(index,{...item,label})}/>}{item.document?<LocalizedEditor appearance="body" label="Content" value={item.document} onChange={document=>updateItem(index,{...item,document,value:{en:textContent(document.en),ar:textContent(document.ar),fr:textContent(document.fr)}})}/>:<LocalizedFields label={specifications?'Value':'Content'} value={item.value} multiline={!specifications} onChange={value=>updateItem(index,{...item,value})}/>}
              </div>)}
              {!items.length&&<p className="catalog-muted">No items yet.</p>}
            </div>
            <CatalogButton type="button" onClick={()=>setItems([...items,{...(specifications?{label:emptyLocalized()}:{}),value:emptyLocalized(),...(!specifications&&block.label!=='Applications'?{document:{en:emptyDocument(),ar:emptyDocument(),fr:emptyDocument()}}:{})}])} variant="secondary"><Icon name="add"/>Add {specifications?'specification':block.label==='Applications'?'application':'item'}</CatalogButton>
          </div>
        </details>
      })}
    </CatalogPanel>
}

function GalleryFields({gallery,owner,onChange,productHero=false}:{gallery:ProductGalleryItem[];owner:CmsMediaOwner;onChange:(gallery:ProductGalleryItem[])=>void;productHero?:boolean}) {
  const update=(index:number,patch:Partial<ProductGalleryItem>)=>onChange(gallery.map((item,current)=>current===index?{...item,...patch}:item))
  const move=(index:number,direction:-1|1)=>{const target=index+direction;if(target<0||target>=gallery.length)return;const next=[...gallery];[next[index],next[target]]=[next[target],next[index]];onChange(next)}
  return <CatalogPanel title={<>Gallery</>} description={<>{productHero?'Image 1 is the product hero. The first three images also appear in the product slider.':'Images appear on the category page in this order.'}</>} bodyClassName="catalog-panel-body">
    <div className="catalog-gallery-items">{gallery.map((item,index)=><div className="catalog-gallery-item" key={index}><div className="catalog-item-head"><b>{productHero&&index===0?'Image 1 · Product hero':`Image ${index+1}`}</b><div className="catalog-item-actions"><CatalogIconButton type="button" disabled={index===0} onClick={()=>move(index,-1)} aria-label="Move image up"><Icon name="up"/></CatalogIconButton><CatalogIconButton type="button" disabled={index===gallery.length-1} onClick={()=>move(index,1)} aria-label="Move image down"><Icon name="down"/></CatalogIconButton><ConfirmAction triggerClassName="is-delete" triggerLabel={`Delete image ${index+1}`} title={`Delete image ${index+1}?`} description="This image and its caption will be removed from the draft. Save your changes to make the deletion permanent." onConfirm={()=>onChange(gallery.filter((_,current)=>current!==index))}><Icon name="delete"/></ConfirmAction></div></div><AssetField name={`content.gallery.${index}.image`} field={{id:`gallery-${index}`,label:productHero&&index===0?'Product hero image':'Gallery image',kind:'image',source:'',value:item.image}} owner={owner} conversion="gallery" onChange={image=>update(index,{image})}/><LocalizedFields label="Caption" value={item.caption} onChange={caption=>update(index,{caption})}/></div>)}</div>
    {!gallery.length&&<p className="catalog-muted">No gallery images yet.</p>}
    <CatalogButton type="button" onClick={()=>onChange([...gallery,{image:'',caption:emptyLocalized()}])} variant="secondary"><Icon name="add"/>Add image</CatalogButton>
  </CatalogPanel>
}

function ArtworkFields({artwork,owner,onChange}:{artwork:CatalogBlock;owner:CmsMediaOwner;onChange:(artwork:CatalogBlock)=>void}) {
  const assets=artwork.assets
  const update=(index:number,value:string)=>onChange({...artwork,assets:assets.map((asset,current)=>current===index?{...asset,value}:asset)})
  const move=(index:number,direction:-1|1)=>{
    const target=index+direction
    if(target<0||target>=assets.length)return
    const next=[...assets]
    ;[next[index],next[target]]=[next[target],next[index]]
    onChange({...artwork,assets:next})
  }
  const remove=(index:number)=>onChange({...artwork,assets:assets.filter((_,current)=>current!==index)})
  const add=()=>{
    if(assets.length>=MAX_CATEGORY_ARTWORK_IMAGES)return
    const id=`artwork-${crypto.randomUUID()}`
    onChange({...artwork,assets:[...assets,{id,label:`Image ${assets.length+1}`,kind:'image',source:id,value:''}]})
  }
  const full=assets.length>=MAX_CATEGORY_ARTWORK_IMAGES
  return <CatalogPanel title={<>Homepage card artwork</>} description={<>Layered images shown above this category on the homepage. Their order controls placement and overlap. Add up to {MAX_CATEGORY_ARTWORK_IMAGES} images.</>} bodyClassName="catalog-panel-body">
    <div className="catalog-gallery-items catalog-artwork-items">{assets.map((asset,index)=><div className="catalog-gallery-item" key={asset.id}>
      <div className="catalog-item-head"><b>Image {index+1}</b><div className="catalog-item-actions">
        <CatalogIconButton type="button" disabled={index===0} onClick={()=>move(index,-1)} aria-label={`Move artwork image ${index+1} up`}><Icon name="up"/></CatalogIconButton>
        <CatalogIconButton type="button" disabled={index===assets.length-1} onClick={()=>move(index,1)} aria-label={`Move artwork image ${index+1} down`}><Icon name="down"/></CatalogIconButton>
        <ConfirmAction triggerClassName="is-delete" triggerLabel={`Delete artwork image ${index+1}`} title={`Delete image ${index+1}?`} description="This image will be removed from the homepage artwork. Save your changes to make the deletion permanent." onConfirm={()=>remove(index)}><Icon name="delete"/></ConfirmAction>
      </div></div>
      <AssetField name={`content.artwork.assets.${index}.value`} field={{...asset,label:`Artwork image ${index+1}`,kind:'image'}} owner={owner} conversion="artwork" onChange={value=>update(index,value)}/>
    </div>)}</div>
    {!assets.length&&<p className="catalog-muted">No homepage artwork images yet.</p>}
    <CatalogButton type="button" onClick={add} variant="secondary" disabled={full}><Icon name="add"/>{full?`Maximum ${MAX_CATEGORY_ARTWORK_IMAGES} images`:'Add image'}</CatalogButton>
  </CatalogPanel>
}

export function CatalogManager({catalog,kind,capabilities,initialRecord}:{catalog:Catalog;kind:'product'|'category';capabilities:AdminCapabilities;initialRecord?:Category|Product}) {
  const router=useRouter()
  const [selected,setSelected]=useState<Category|Product|null>(initialRecord??null)
  const basePath=kind==='product'?'/admin/products':'/admin/product-categories'
  const creating=Boolean(selected&&!selected.id)
  const form=useAdminForm(selected)
  const busy=form.submitting
  const run=async(action:()=>Promise<AdminResult>)=>{
    const result=await form.run(action)
    if(result?.ok)router.refresh()
  }

  const product=selected&&'category_id' in selected?selected:null
  const categoryRecord=selected&&!('category_id' in selected)?selected:null
  const categoryHero=categoryRecord?.content.page.blocks.find(block=>block.key==='section-0')
  const owner:CmsMediaOwner=selected?.id?{type:kind,key:String(selected.id)}:{type:'website-setting',key:'catalog'}
  const updateContent=(patch:Partial<Category['content']&Product['content']>)=>selected&&setSelected({...selected,content:{...selected.content,...patch}} as Category|Product)
  const title=kind==='product'?'Products':'Product categories'
  const singular=kind==='product'?'product':'category'

  if (!selected) throw new Error('An editor record is required.')

  const category=product?catalog.categories.find(item=>item.id===product.category_id):null
  const websiteHref=selected.id>0&&selected.published?(product&&category?productPath(product,category):categoryPath(selected as Category,catalog.products)):null
  return <AdminFormProvider form={form}><section className="catalog-admin-page catalog-edit-page"><AdminForm noValidate onChangeCapture={()=>form.change()} onSubmit={event=>{event.preventDefault();void run(()=>saveCatalogRecord(kind,selected.id,JSON.stringify(selected)))}}>
    <AdminPageHeader title={<>{creating?`Add ${singular}`:`Edit ${selected.content.name.en||singular}`}</>} eyebrow={<>Catalog / {title}</>} backHref={basePath} creating={creating} noun={singular} submitting={busy} canSave={creating ? capabilities.create : capabilities.edit} sticky/>
    <FormNotice result={form.result}/>
    <CatalogFormGrid><CatalogFormMain>
      <CatalogPanel title={<>Basic information</>} description={<>Enter the customer-facing content in all three languages.</>} bodyClassName="catalog-panel-body"><LocalizedFields name="content.name" label="Name" value={selected.content.name} onChange={name=>updateContent({name})}/><LocalizedFields label="Short description" value={selected.content.description} multiline onChange={description=>updateContent({description})}/></CatalogPanel>
      <CatalogPanel title={<>Search engine optimization</>} description={<>Optional. Empty fields use the name and short description.</>} bodyClassName="catalog-panel-body"><LocalizedFields label="SEO title" value={selected.content.seo.title} onChange={title=>updateContent({seo:{...selected.content.seo,title}})}/><LocalizedFields label="SEO description" value={selected.content.seo.description} multiline onChange={description=>updateContent({seo:{...selected.content.seo,description}})}/></CatalogPanel>
      {product&&<>
        <CatalogPanel title={<>Product filters</>} description={<>Used to filter products on the catalog page.</>} bodyClassName="catalog-panel-body"><div className="catalog-filter-grid">{(['applications','concentrations'] as const).map(key=><fieldset className="catalog-check-group" key={key}><legend>{key==='applications'?'Applications':'Concentrations'}</legend><div>{catalog.settings[key].map(option=><label key={option.id}><input type="checkbox" checked={product.content[key].includes(option.id)} onChange={event=>updateContent({[key]:event.target.checked?[...product.content[key],option.id]:product.content[key].filter(id=>id!==option.id)})}/><span>{option.label.en}</span></label>)}</div></fieldset>)}</div></CatalogPanel>
        <GalleryFields gallery={product.content.gallery} owner={owner} productHero onChange={gallery=>updateContent({gallery})}/>
        <ProductSections product={product} onChange={page=>updateContent({page})}/>
        <CatalogPanel title={<>Technical data sheet</>} description={<>Optional PDF for each language.</>} bodyClassName="catalog-panel-body"><LocalizedPdfFields label="TDS files" owner={owner} value={product.content.tds} onChange={tds=>updateContent({tds})}/><p className="catalog-help">The company profile PDF is managed once in Website settings.</p></CatalogPanel>
      </>}
      {categoryRecord&&<CatalogPanel title={<>Category page content</>} description={<>Text shown in the category hero and introduction, in all three languages.</>} bodyClassName="catalog-panel-body">{categoryRecord.content.pageCopy.heroHeading&&<LocalizedEditor label="Hero heading" value={categoryRecord.content.pageCopy.heroHeading} onChange={heroHeading=>updateContent({pageCopy:{...categoryRecord.content.pageCopy,heroHeading}})}/> }<LocalizedFields label="Hero description" value={categoryRecord.content.pageCopy.heroDescription} multiline onChange={heroDescription=>updateContent({pageCopy:{...categoryRecord.content.pageCopy,heroDescription}})}/>{categoryRecord.content.pageCopy.introHeading&&<LocalizedEditor label="Introduction heading" value={categoryRecord.content.pageCopy.introHeading} onChange={introHeading=>updateContent({pageCopy:{...categoryRecord.content.pageCopy,introHeading}})}/> }<LocalizedFields label="Introduction description" value={categoryRecord.content.pageCopy.introDescription} multiline onChange={introDescription=>updateContent({pageCopy:{...categoryRecord.content.pageCopy,introDescription}})}/><p className="catalog-help">The category number, category name in the eyebrow, and breadcrumbs are generated automatically.</p></CatalogPanel>}
      {categoryRecord&&<ArtworkFields
        artwork={categoryRecord.content.artwork}
        owner={owner}
        onChange={artwork=>updateContent({artwork})}
      />}
      {categoryRecord&&<CatalogPanel title={<>Category images</>} description={<>One optimized hero image and one compact products-menu icon.</>} bodyClassName="catalog-panel-body">{categoryHero?.assets[0]&&<AssetField field={{...categoryHero.assets[0],label:'Category hero image'}} owner={owner} onChange={value=>setSelected({...categoryRecord,content:{...categoryRecord.content,page:{...categoryRecord.content.page,blocks:categoryRecord.content.page.blocks.map(block=>block.key===categoryHero.key?{...block,assets:block.assets.map((item,index)=>index===0?{...item,value}:item)}:block)}}})}/>}<AssetField name="content.icon" field={{id:'icon',label:'Category icon / menu thumbnail',kind:'image',source:'',value:categoryRecord.content.icon}} owner={owner} onChange={icon=>setSelected({...categoryRecord,content:{...categoryRecord.content,icon}})}/></CatalogPanel>}
      {categoryRecord&&<GalleryFields gallery={categoryRecord.content.gallery??[]} owner={owner} onChange={gallery=>setSelected({...categoryRecord,content:{...categoryRecord.content,gallery}})}/>}
    </CatalogFormMain><CatalogFormSidebar>
      <CatalogPanel title={<>Publishing</>} bodyClassName="catalog-panel-body"><label className="catalog-switch"><input type="checkbox" checked={selected.published} onChange={event=>setSelected({...selected,published:event.target.checked})}/><span aria-hidden="true"/><b>{selected.published?'Published':'Draft'}</b></label><p className="catalog-help">Draft records are hidden from the website.</p></CatalogPanel>
      <CatalogPanel title={<>Organization</>} bodyClassName="catalog-panel-body"><UrlField name="slug" label="URL slug" value={selected.slug} onChange={slug=>setSelected({...selected,slug})}/>{product&&<CatalogField name="category_id"><span>Category</span><select  value={product.category_id} onChange={event=>{form.change("category_id");setSelected({...product,category_id:Number(event.target.value)})}}><option value={0}>Choose a category</option>{catalog.categories.map(item=><option key={item.id} value={item.id}>{item.content.name.en}</option>)}</select></CatalogField>}<CatalogField name="sort_order"><span>Display order</span><input  type="number" value={Number.isNaN(selected.sort_order)?'':selected.sort_order} onChange={event=>setSelected({...selected,sort_order:event.target.value===''?Number.NaN:Number(event.target.value)})}/></CatalogField></CatalogPanel>
      {websiteHref&&<CatalogButtonLink variant="view" target="_blank" rel="noreferrer" href={websiteHref}><Icon name="external"/>View on website</CatalogButtonLink>}
    </CatalogFormSidebar></CatalogFormGrid>
  </AdminForm></section></AdminFormProvider>
}
