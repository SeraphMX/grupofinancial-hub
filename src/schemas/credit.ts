import { z } from 'zod'

const phoneRegex = /^[0-9]{10}$/
const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{3}$/

export const personalFormSchema = z.object({
  name: z.string().min(5, 'El nombre debe tener al menos 5 caracteres').max(100, 'El nombre no puede exceder los 100 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().regex(phoneRegex, 'El teléfono debe tener 10 dígitos'),
  rfc: z.string().regex(rfcRegex, 'RFC inválido'),
  creditDestination: z
    .string()
    .min(5, 'El destino del crédito debe tener al menos 5 caracteres')
    .nullable()
    .or(z.literal(''))
    .refine((value) => value !== null && value !== '', { message: 'Debes seleccionar una opción' }),
  ciec: z.string().min(8, 'La clave CIEC es de 8 caracteres').nullable().or(z.literal(''))
})

export const businessFormSchema = personalFormSchema.extend({
  companyName: z
    .string()
    .min(5, 'El nombre de la empresa debe tener al menos 5 caracteres')
    .max(100, 'El nombre de la empresa no puede exceder los 100 caracteres'),
  industry: z
    .string()
    .min(2, 'La industria debe tener al menos 2 caracteres')
    .max(50, 'La industria no puede exceder los 50 caracteres')
    .nullable()
    .or(z.literal(''))
    .refine((value) => value !== null && value !== '', { message: 'Debes seleccionar una opción' }),
  annualRevenue: z.enum(['menos-2m', '2m-10m', '10m-25m', 'mas-25m'], {
    required_error: 'Selecciona los ingresos anuales'
  })
})
