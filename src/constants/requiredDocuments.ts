import { z } from 'zod';

// Schema para validar documentos
export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  required: z.boolean(),
  category: z.enum(['identification', 'financial', 'property', 'business', 'guarantees']),
});

export type RequiredDocument = z.infer<typeof documentSchema>;

// Documentos base que aplican para todos los tipos de crédito
const baseDocuments: RequiredDocument[] = [
  {
    id: 'id-oficial',
    name: 'Identificación oficial',
    description: 'INE, pasaporte o cédula profesional vigente',
    required: true,
    category: 'identification',
  },
  {
    id: 'comprobante-domicilio',
    name: 'Comprobante de domicilio',
    description: 'No mayor a 3 meses de antigüedad',
    required: true,
    category: 'identification',
  },
  {
    id: 'comprobante-ingresos',
    name: 'Comprobante de ingresos',
    description: 'Últimos 3 recibos de nómina o estados de cuenta',
    required: true,
    category: 'financial',
  },
  {
    id: 'declaracion-impuestos',
    name: 'Declaración de impuestos',
    description: 'Última declaración anual',
    required: false,
    category: 'financial',
  },
];

// Documentos específicos para crédito simple
const simpleDocuments: RequiredDocument[] = [
  ...baseDocuments,
  {
    id: 'estado-cuenta',
    name: 'Estados de cuenta bancarios',
    description: 'Últimos 3 meses',
    required: true,
    category: 'financial',
  },
  {
    id: 'buro-credito',
    name: 'Reporte de buró de crédito',
    description: 'No mayor a 1 mes',
    required: true,
    category: 'financial',
  },
];

// Documentos específicos para crédito revolvente
const revolvingDocuments: RequiredDocument[] = [
  ...baseDocuments,
  {
    id: 'estado-cuenta',
    name: 'Estados de cuenta bancarios',
    description: 'Últimos 6 meses',
    required: true,
    category: 'financial',
  },
  {
    id: 'buro-credito',
    name: 'Reporte de buró de crédito',
    description: 'No mayor a 1 mes',
    required: true,
    category: 'financial',
  },
  {
    id: 'plan-negocio',
    name: 'Plan de negocio',
    description: 'Proyección de flujos y uso del crédito',
    required: true,
    category: 'business',
  },
];

// Documentos específicos para arrendamiento
const leasingDocuments: RequiredDocument[] = [
  ...baseDocuments,
  {
    id: 'estado-cuenta',
    name: 'Estados de cuenta bancarios',
    description: 'Últimos 6 meses',
    required: true,
    category: 'financial',
  },
  {
    id: 'buro-credito',
    name: 'Reporte de buró de crédito',
    description: 'No mayor a 1 mes',
    required: true,
    category: 'financial',
  },
  {
    id: 'cotizacion-bien',
    name: 'Cotización del bien',
    description: 'Cotización formal del bien a arrendar',
    required: true,
    category: 'property',
  },
  {
    id: 'seguro-bien',
    name: 'Seguro del bien',
    description: 'Póliza de seguro que cubra el bien',
    required: true,
    category: 'property',
  },
];

// Documentos adicionales para personas morales
const businessDocuments: RequiredDocument[] = [
  {
    id: 'acta-constitutiva',
    name: 'Acta constitutiva',
    description: 'Acta constitutiva de la empresa',
    required: true,
    category: 'business',
  },
  {
    id: 'poder-representante',
    name: 'Poder del representante legal',
    description: 'Poder notarial del representante legal',
    required: true,
    category: 'business',
  },
  {
    id: 'estados-financieros',
    name: 'Estados financieros',
    description: 'Estados financieros de los últimos 2 ejercicios',
    required: true,
    category: 'financial',
  },
  {
    id: 'registro-fiscal',
    name: 'Constancia de situación fiscal',
    description: 'Documento actualizado del SAT',
    required: true,
    category: 'business',
  },
];

// Función para obtener los documentos según el tipo de crédito y tipo de cliente
export function getRequiredDocuments(
  creditType: 'simple' | 'revolvente' | 'arrendamiento',
  clientType: 'personal' | 'empresarial'
): RequiredDocument[] {
  let documents: RequiredDocument[] = [];

  // Seleccionar documentos base según tipo de crédito
  switch (creditType) {
    case 'simple':
      documents = simpleDocuments;
      break;
    case 'revolvente':
      documents = revolvingDocuments;
      break;
    case 'arrendamiento':
      documents = leasingDocuments;
      break;
    default:
      documents = baseDocuments;
  }

  // Agregar documentos de persona moral si es empresarial
  if (clientType === 'empresarial') {
    documents = [...documents, ...businessDocuments];
  }

  return documents;
}

// Función para verificar si un documento es requerido
export function isDocumentRequired(
  documentId: string,
  creditType: 'simple' | 'revolvente' | 'arrendamiento',
  clientType: 'personal' | 'empresarial'
): boolean {
  const documents = getRequiredDocuments(creditType, clientType);
  const document = documents.find(doc => doc.id === documentId);
  return document?.required ?? false;
}

// Función para obtener el total de documentos requeridos
export function getRequiredDocumentsCount(
  creditType: 'simple' | 'revolvente' | 'arrendamiento',
  clientType: 'personal' | 'empresarial'
): number {
  const documents = getRequiredDocuments(creditType, clientType);
  return documents.filter(doc => doc.required).length;
}

// Función para obtener documentos por categoría
export function getDocumentsByCategory(
  creditType: 'simple' | 'revolvente' | 'arrendamiento',
  clientType: 'personal' | 'empresarial',
  category: RequiredDocument['category']
): RequiredDocument[] {
  const documents = getRequiredDocuments(creditType, clientType);
  return documents.filter(doc => doc.category === category);
}