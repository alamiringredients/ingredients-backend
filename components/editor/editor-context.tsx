'use client'
import {createContext,useContext} from 'react'
export const EditorContext = createContext<{upload:(file:File)=>Promise<string>;sectionGoals?:boolean;goalOptions?:{id:number;name:string}[]}>({sectionGoals:false,upload:async()=>{throw new Error('Save the record before uploading.')}})
export const useEditorMedia = () => useContext(EditorContext)
