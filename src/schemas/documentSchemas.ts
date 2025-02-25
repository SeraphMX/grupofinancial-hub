import { z } from "zod";
import { RequiredDocument } from "../constants/requiredDocuments";

// Schema para validar documentos
export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  required: z.boolean(),
  category: z.enum(['identification', 'financial', 'property', 'business', 'guarantees']),
});

export interface Document extends RequiredDocument {
   dbDocument?: {
    id: string
    original_name?: string
    url: string
    created_at: string
    status: 'pendiente' | 'aceptado' | 'rechazado' | 'excluido'
    file_size?: number
    reject_cause?: 'incompleto' | 'incorrecto' | 'invalido' | 'ilegible' | 'alterado' | 'desactualizado'
  }
}