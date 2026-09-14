import {Extension,Node,mergeAttributes} from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import {ReactNodeViewRenderer} from '@tiptap/react'
import {BlockView} from './block-view'
const custom = (name:string,content?:string,attrs:Record<string,unknown>={}) => Node.create({
  name,group:'block',content,atom:!content,draggable:true,isolating:true,
  addAttributes:()=>Object.fromEntries(Object.entries({visible:true,...attrs}).map(([key,value])=>[key,{default:value}])),
  parseHTML:()=>[{tag:`div[data-content-block="${name}"]`}],
  renderHTML:({HTMLAttributes})=>content?['div',mergeAttributes(HTMLAttributes,{'data-content-block':name}),0]:['div',{'data-content-block':name}],
  addNodeView:()=>ReactNodeViewRenderer(BlockView),
})
export const contentExtensions = [
  StarterKit.configure({heading:{levels:[2,3]},code:false,codeBlock:false,strike:false,link:{openOnClick:false,protocols:['http','https','mailto','tel']}}),
  Extension.create({name:'brandAttributes',addGlobalAttributes:()=>[
    {types:['heading'],attributes:{id:{default:null},hideFromContents:{default:false}}},
    {types:['paragraph'],attributes:{variant:{default:'body',parseHTML:element=>element.getAttribute('data-variant')??'body',renderHTML:attributes=>({'data-variant':attributes.variant})}}},
    {types:['blockquote'],attributes:{citation:{default:''}}},
    {types:['paragraph','heading','blockquote','bulletList','orderedList','horizontalRule'],attributes:{visible:{default:true,parseHTML:element=>element.getAttribute('data-visible')!=='false',renderHTML:attributes=>attributes.visible===false?{'data-visible':'false'}:{}}}},
  ]}),
  custom('image',undefined,{captionLabel:'',src:'',alt:'',caption:'',captionPosition:'below',ratio:'original',position:'center'}),
  custom('gallery',undefined,{images:[],caption:'',captionPosition:'below'}),
  custom('facts',undefined,{label:'',items:[]}),
  custom('textStatistics','block*',{label:'',markSrc:'',markAlt:'',markHref:'',items:[]}),
  custom('columns','column{2,3}',{layout:'equal',verticalAlign:'start',mediaSide:'start'}),
  Node.create({name:'column',content:'block+',isolating:true,parseHTML:()=>[{tag:'div[data-column]'}],renderHTML:()=>['div',{'data-column':''},0]}),
  custom('video',undefined,{source:'upload',src:'',mode:'player',autoplay:false,loop:false,muted:false,controls:true,poster:'',caption:'',captionPosition:'below',captionStyle:'plain',label:'',ratio:'16/9'}),
  custom('sectionHeader','heading paragraph?',{eyebrow:'',width:'measure',layout:'stacked',singleLine:false,ctaLabel:'',ctaHref:''}),
  custom('actions',undefined,{items:[]}),
  custom('aboutProfile',undefined,{image:'',alt:'',storyLabel:'',story:'',visionLabel:'',vision:'',missionLabel:'',mission:''}),
  custom('valuesRail',undefined,{items:[]}),
  custom('mediaCards',undefined,{items:[]}),
  custom('pillars',undefined,{items:[]}),
  custom('certificationPanel',undefined,{holder:'group'}),
  custom('contentSection','block+',{id:'section',goals:[],theme:'plain'}),
  custom('dataTable',undefined,{statusColumn:false,caption:'',headers:['',''],rows:[['','']]}),
  custom('callout','block+',{variant:'accent'}),
]

// Inline fields share the editor UI while keeping page layout outside the document.
export const inlineExtensions = [
  StarterKit.configure({heading:false,blockquote:false,bulletList:false,orderedList:false,listItem:false,listKeymap:false,code:false,codeBlock:false,horizontalRule:false,strike:false,underline:false,link:false}),
  Extension.create({name:'inlineLineBreak',addKeyboardShortcuts(){return {Enter:()=>this.editor.commands.setHardBreak()}}}),
]
