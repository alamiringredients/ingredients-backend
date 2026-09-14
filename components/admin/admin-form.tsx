'use client'

import type {FormHTMLAttributes} from 'react'

export function AdminForm({children,...props}:FormHTMLAttributes<HTMLFormElement>){
  return <form {...props} noValidate>{children}</form>
}
