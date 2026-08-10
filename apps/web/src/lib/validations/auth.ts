import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres.'),
  username: z.string()
    .min(3, 'O username deve ter no mínimo 3 caracteres.')
    .max(30, 'O username pode ter no máximo 30 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'O username deve conter apenas letras, números e underline (_).'),
  displayName: z.string().min(2, 'O nome de exibição deve ter no mínimo 2 caracteres.').max(50),
  region: z.string().min(2).max(5),
})

export const LoginSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
