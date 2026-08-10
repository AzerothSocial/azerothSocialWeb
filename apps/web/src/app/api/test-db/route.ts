import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Testar conexão buscando a contagem da tabela profiles
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Falha ao conectar no Supabase ou consultar a tabela profiles.',
        error: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão com o Supabase estabelecida com sucesso e tabelas RLS validadas!',
      profilesCount: count ?? 0,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao validar credenciais.',
      error: errorMessage,
    }, { status: 500 })
  }
}
