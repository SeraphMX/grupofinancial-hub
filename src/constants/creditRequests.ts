import {
  CalendarClock,
  CircleOff,
  CloudDownload,
  CloudUpload,
  FileCheck2,
  FileLock2,
  FileMinus,
  FilePlus,
  FilePlus2,
  FileSearch,
  ListChecks,
  SmilePlus,
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

export type RequestHistoryConfig = typeof requestHistoryConfig

export function getRequestHistoryConfig(key: keyof RequestHistoryConfig) {
  return requestHistoryConfig[key]
}
