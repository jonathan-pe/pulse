'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { SignupSchema } from '@/types/user'
import { SignUpWithPasswordCredentials } from '@supabase/supabase-js'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(values: SignupSchema) {
  const supabase = await createClient()

  const data: SignUpWithPasswordCredentials = {
    email: values.email,
    password: values.password,
    options: { captchaToken: values.captchaToken, data: { username: values.username } },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Error signing up:', error)
    return { error }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
