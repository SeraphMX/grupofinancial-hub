import { RequiredDocument } from "../schemas/documentSchemas";


// Documentos base que aplican para todos los tipos de crédito
const baseDocuments: RequiredDocument[] = [
  {
    id: 'id-oficial',
    name: 'Identificación oficial',
    description: 'INE, pasaporte o cédula profesional vigente',
    required: true,
    category: 'identification',
    multipleFiles: true

  },
  {
    id: 'constancia-identificacion-fiscal',
    name: 'CSF SAT',
    description: 'Constancia de situación fiscal actualizada',
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
    description: 'Últimos 6 estados de cuenta',
    required: true,
    category: 'financial',
    multipleFiles: true
  },
  {
    id: 'historial-crediticio',
    name: 'Historial crediticio',
    description: 'Buró de crédito actualizado',
    required: false,
    category: 'financial',
  }
  
];

// Documentos de la garantía
const guaranteeDocuments: RequiredDocument[] = [
  {
    id: 'escrituras-propiedad',
    name: 'Escrituras de propiedad',
    description: 'Con el sello del Registro Público de la Propiedad, libre de gravámenes',
    required: true,
    category: 'guarantees',
  },
  {
    id: 'boleta-predial',
    name: 'Boleta predial',
    description: 'Boleta predial del año en curso',
    required: true,
    category: 'guarantees',
  },
  {
    id: 'recibo-agua',
    name: 'Recibo de agua',
    description: 'Recibo de agua reciente, no mayor a 3 meses',
    required: true,
    category: 'guarantees',
  },
  {
    id: 'avaluo-comercial',
    name: 'Avalúo comercial',
    description: 'Avalúo comercial del inmueble',
    required: false,
    category: 'guarantees',
  }
];

// Documentos específicos para crédito simple
const simpleDocuments: RequiredDocument[] = [
  ...baseDocuments,
  {
    id: 'id-oficial-conyuge',
    name: 'Identificación oficial del cónyuge',
    description: 'INE, pasaporte o cédula profesional vigente',
    required: false,
    category: 'identification',
    multipleFiles: true
  },
  {
    id: 'acta-matrimonio',
    name: 'Acta de matrimonio',
    description: 'Acta de matrimonio',
    required: false,
    category: 'identification',
  }
];
// Documentos específicos para crédito simple con garantía
const simpleGuaranteeDocuments: RequiredDocument[] = [
  ...baseDocuments,
  {
    id: 'acta-matrimonio',
    name: 'Acta de matrimonio',
    description: 'Acta de matrimonio',
    required: false,
    category: 'identification',
  },
  {
    id: 'id-oficial-conyuge',
    name: 'Identificación oficial del cónyuge',
    description: 'INE, pasaporte o cédula profesional vigente',
    required: false,
    category: 'identification',
  }
];

// Documentos específicos para crédito revolvente
const revolvingDocuments: RequiredDocument[] = [
  ...baseDocuments,
  {
    id: 'declaraciones-anuales',
    name: 'Declaraciones anuales',
    description: 'De los últimos 2 años',
    required: true,
    category: 'financial',
    multipleFiles: true
  },
  ...guaranteeDocuments
];

// Documentos específicos para arrendamiento
const leasingDocuments: RequiredDocument[] = [
  ...baseDocuments, 
  {
    id: 'cotizacion-activo',
    name: 'Cotización del activo',
    description: 'Cotización formal del activo a arrendar',
    required: false,
    category: 'property',
  },
  {
    id: 'factura-activo',
    name: 'Factura del activo',
    description: 'Factura del activo a arrendar',
    required: false,
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
    id: 'ine-representante',
    name: 'Identificación del representante legal',
    description: 'INE, pasaporte o cédula profesional vigente',
    required: true,
    category: 'business',
    multipleFiles: true
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

      // Agregar documentos de garantía si es crédito simple con garantía
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