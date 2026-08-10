'use server'

import { createClient } from '@/lib/supabase/server'
import { RegisterSchema, LoginSchema, type RegisterInput, type LoginInput } from '@/lib/validations/auth'
import { redirect } from 'next/navigation'

export async function registerAction(data: RegisterInput) {
  // 1. Sanitização e Validação no Servidor com Zod
  const validation = RegisterSchema.safeParse(data)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados inválidos.',
    }
  }

  const { email, password, username, displayName, region } = validation.data
  const supabase = await createClient()

  // 2. Verificar se Username já existe (Prevenção de duplicidade)
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (existingUser) {
    return {
      success: false,
      error: 'Este username já está em uso por outro jogador.',
    }
  }

  // 3. Cadastrar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase(),
        display_name: displayName,
      },
    },
  })

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || 'Falha ao registrar conta.',
    }
  }

  // Define um avatar padrão de WoW (Peon/Grunt/Anon)
  const defaultWowAvatar = 'https://render.worldofwarcraft.com/us/character/anon/anon-avatar.jpg' // Default blizzard anon avatar or similar URL. Let's use a nice Unsplash or fixed generic for now.
  const customWowAvatar = 'https://i.imgur.com/8Q5Z2jQ.jpeg' // Using a generic placeholder if needed, wait, I will use a reliable image URL.

  // 4. Inserir ou atualizar perfil (Caso o trigger não tenha disparado automaticamente)
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    username: username.toLowerCase(),
    display_name: displayName,
    region: region,
    avatar_url: customWowAvatar,
  })

  if (profileError) {
    // Se a sessão foi iniciada no Auth, prosseguir para o feed mesmo que o upsert tenha falhado por race condition do trigger
    console.error('Perfil warning:', profileError.message)
  }

  redirect('/feed')
}

export async function loginAction(data: LoginInput) {
  // 1. Sanitização e Validação no Servidor
  const validation = LoginSchema.safeParse(data)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Dados de login inválidos.',
    }
  }

  const { email, password } = validation.data
  const supabase = await createClient()

  // 2. Autenticação via Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      error: 'E-mail ou senha incorretos.',
    }
  }

  redirect('/feed')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
