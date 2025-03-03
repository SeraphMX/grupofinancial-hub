import {
  CalendarClock,
  CircleAlert,
  CircleOff,
  CircleX,
  CloudDownload,
  CloudUpload,
  FileCheck2,
  FileLock2,
  FileMinus,
  FilePlus,
  FilePlus2,
  FileSearch,
  FolderInput,
  ListChecks,
  SmilePlus,
  TriangleAlert,
  UserRoundPlus
} from 'lucide-react'

const requestHistoryConfig = {
  'request-created': {
    color: 'primary',
    icon: SmilePlus,
    text: 'Solicitud creada'
  },
  'request-assign': {
    color: 'success',
    icon: UserRoundPlus,
    text: 'Solicitud asignada'
  },
  'request-cancel': {
    color: 'danger',
    icon: CircleOff,
    text: 'Solicitud cancelada'
  },
  'request-complete': {
    color: 'success',
    icon: ListChecks,
    text: 'Solicitud completada'
  },
  'request-approved': {
    color: 'success',
    icon: ListChecks,
    text: 'Solicitud aprobada'
  },
  'request-denied': {
    color: 'danger',
    icon: CircleOff,
    text: 'Solicitud no aprobada'
  },
  'request-ciec': {
    color: 'success',
    icon: FileLock2,
    text: 'Solicitud CIEC'
  },
  'request-lastUpdate': {
    color: 'primary',
    icon: CalendarClock,
    text: 'Última actualización'
  },
  'doc-add': {
    color: 'secondary',
    icon: FilePlus2,
    text: 'Documento agregado'
  },
  'doc-accepted': {
    color: 'success',
    icon: FileCheck2,
    text: 'Documento aceptado'
  },
  'doc-rejected': {
    color: 'danger',
    icon: FileCheck2,
    text: 'Documento rechazado'
  },
  'doc-exclude': {
    color: 'danger',
    icon: FileMinus,
    text: 'Documento excluido'
  },
  'doc-include': {
    color: 'success',
    icon: FilePlus,
    text: 'Documento incluido'
  },
  'doc-upload': {
    color: 'primary',
    icon: CloudUpload,
    text: 'Documento subido'
  },
  'doc-download': {
    color: 'primary',
    icon: CloudDownload,
    text: 'Documento descargado'
  },
  'doc-view': {
    color: 'primary',
    icon: FileSearch,
    text: 'Documento visto'
  },
  'doc-delete': {
    color: 'danger',
    icon: FileSearch,
    text: 'Documento eliminado'
  }
} as const

const requestStatusConfig = {
  nueva: {
    icon: CircleAlert,
    color: 'primary',
    text: 'Nueva'
  },
  en_revision: {
    icon: TriangleAlert,
    color: 'warning',
    text: 'En revisión'
  },
  documentacion: {
    icon: FolderInput,
    color: 'secondary',
    text: 'Documentación'
  },
  completada: {
    icon: ListChecks,
    color: 'success',
    text: 'Completada'
  },
  aprobada: {
    icon: ListChecks,
    color: 'success',
    text: 'Aprobada'
  },
  rechazada: {
    icon: CircleOff,
    color: 'danger',
    text: 'Rechazada'
  },
  cancelada: {
    icon: CircleX,
    color: 'danger',
    text: 'Cancelada'
  }
} as const

export const creditDestinations = [
  { label: 'Capital de trabajo', key: 'capital-de-trabajo', description: 'Cubrir gastos operativos, nómina, insumos, etc.' },
  {
    label: 'Expansión de negocio',
    key: 'expansion-de-negocio',
    description: 'Apertura de sucursales, adquisición de equipos, remodelaciones.'
  },
  { label: 'Compra de activos', key: 'compra-de-activos', description: 'Maquinaria, vehículos, mobiliario, tecnología.' },
  {
    label: 'Consolidación de deudas',
    key: 'consolidacion-de-deudas',
    description: 'Reestructuración de pasivos para mejorar flujo de efectivo.'
  },
  { label: 'Inversión en proyectos', key: 'inversion-en-proyectos', description: 'Desarrollo de nuevos productos o servicios.' },
  { label: 'Importación o exportación', key: 'importacion-o-exportacion', description: 'Financiamiento para comercio internacional.' },
  { label: 'Marketing y publicidad', key: 'marketing-y-publicidad', description: 'Impulsar ventas y posicionamiento de marca.' },
  { label: 'Adquisición de inventario', key: 'adquisicion-de-inventario', description: 'Mantener stock sin afectar liquidez.' },
  { label: 'Viajes', key: 'viajes', description: 'Viajes de negocios o esparcimiento' },

  { label: 'Otro destino', key: 'otros', description: 'Especificar en el campo de comentarios.' }
]

export type requestStatusConfig = typeof requestStatusConfig
export function getRequestStatusConfig(key: keyof requestStatusConfig) {
  return requestStatusConfig[key]
}

export type RequestHistoryConfig = typeof requestHistoryConfig
export function getRequestHistoryConfig(key: keyof RequestHistoryConfig) {
  return requestHistoryConfig[key]
}
