import { z } from "zod";

export type RequiredDocument = z.infer<typeof documentSchema>;
// Schema para validar documentos
export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  required: z.boolean(),
  category: z.enum(['identification', 'financial', 'property', 'business', 'guarantees', 'adress']),
  multipleFiles: z.boolean().optional()
});

export interface Document extends RequiredDocument {
   dbDocument?: {
    id: string
    tipo: string
    original_name?: string
    url: string
    created_at: string
    status: 'pendiente' | "revision" | 'aceptado' | 'rechazado' | 'excluido'
    file_size?: number
    reject_cause?: 'incompleto' | 'incorrecto' | 'invalido' | 'ilegible' | 'alterado' | 'desactualizado'
  }
}