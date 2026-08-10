import { z } from 'zod'

// Esquema rígido de validação para Posts (Prevenção de Spam, XSS e Payload Injection)
export const CreatePostSchema = z.object({
  content: z.string()
    .min(1, 'A publicação não pode estar vazia.')
    .max(1000, 'A publicação deve ter no máximo 1000 caracteres.')
    // Sanitização simples de tags HTML maliciosas
    .transform((val) => val.replace(/</g, '&lt;').replace(/>/g, '&gt;')),
  characterId: z.string().uuid().optional().or(z.literal('')),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
})

// Esquema de validação para Comentários
export const CreateCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string()
    .min(1, 'O comentário não pode estar vazio.')
    .max(500, 'O comentário deve ter no máximo 500 caracteres.')
    .transform((val) => val.replace(/</g, '&lt;').replace(/>/g, '&gt;')),
})

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>
