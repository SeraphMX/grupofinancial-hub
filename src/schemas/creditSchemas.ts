import { z } from 'zod';

export const personalCreditSchema = z.object({
  applicantName: z.string().min(1, 'El nombre es requerido'),
  applicantId: z.string().min(1, 'La identificación es requerida'),
  income: z.number().min(1, 'El ingreso debe ser mayor a 0'),
  amount: z.number().min(1000, 'El monto mínimo es 1000'),
  term: z.number().min(6, 'El plazo mínimo es 6 meses'),
  purpose: z.string().min(1, 'El propósito es requerido'),
});

export const businessCreditSchema = z.object({
  businessName: z.string().min(1, 'El nombre de la empresa es requerido'),
  businessId: z.string().min(1, 'El RUC es requerido'),
  annualRevenue: z.number().min(1, 'Los ingresos anuales son requeridos'),
  amount: z.number().min(5000, 'El monto mínimo es 5000'),
  term: z.number().min(12, 'El plazo mínimo es 12 meses'),
  purpose: z.string().min(1, 'El propósito es requerido'),
});

export type PersonalCreditForm = z.infer<typeof personalCreditSchema>;
export type BusinessCreditForm = z.infer<typeof businessCreditSchema>;