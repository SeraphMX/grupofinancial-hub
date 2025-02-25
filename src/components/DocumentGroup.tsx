import { Button, Card, Chip, Tooltip } from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  Eye,
  FileCheck,
  FileMinus2,
  FilePlus2,
  FileText,
  FileWarning,
  FileX,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Document } from '../schemas/documentSchemas'

const DocumentStatus = ({ status }: { status: 'pendiente' | 'aceptado' | 'rechazado' | 'excluido' }) => {
  const statusConfig = {
    pendiente: {
      color: 'warning',
      icon: AlertTriangle,
      text: 'En revisión'
    },
    aceptado: {
      color: 'success',
      icon: CheckCircle2,
      text: 'Aceptado'
    },
    rechazado: {
      color: 'danger',
      icon: FileX,
      text: 'Rechazado'
    },
    excluido: {
      color: 'primary',
      icon: FileX,
      text: 'Excluido'
    }
  } as const

  const config = statusConfig[status]

  return (
    <div className='flex items-center gap-3'>
      <Chip variant='flat' color={config.color}>
        {config.text}
      </Chip>
    </div>
  )
}

const DocumentGroup = ({
  title,
  documents,
  onView,
  onAccept,
  onReject,
  onExclude,
  onInclude
}: {
  title: string
  documents: Document[]
  onView: (doc: Document) => void
  onAccept: (doc: Document) => void
  onReject: (doc: Document) => void
  onExclude: (doc: Document) => void
  onInclude: (doc: Document) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className='space-y-2'>
      <button
        className='w-full flex items-center gap-2 p-2 hover:bg-default-100 rounded-lg transition-colors'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        <h3 className='text-lg font-semibold'>{title}</h3>
      </button>

      {isExpanded && (
        <div className='space-y-3 sm:pl-6'>
          {documents.map((doc) => (
            <Card key={doc.id} className='p-4'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between'>
                <div className='flex sm:items-center gap-2 sm:gap-4'>
                  {doc.dbDocument?.status === 'aceptado' ? (
                    <FileCheck className='text-success' size={24} />
                  ) : doc.dbDocument?.status === 'rechazado' ? (
                    <FileX className='text-danger' size={24} />
                  ) : doc.dbDocument?.status === 'pendiente' ? (
                    // Caso por defecto: pendiente
                    <FileWarning className='text-warning' size={24} />
                  ) : (
                    // Caso por defecto
                    <FileText className='text-primary' size={24} />
                  )}
                  <div>
                    <h3 className='text-medium font-semibold flex justify-between sm:justify-start items-center gap-2'>
                      {doc.name}
                      {doc.required && (
                        <Chip size='sm' variant='flat' color='danger'>
                          Requerido
                        </Chip>
                      )}
                    </h3>
                    <p className='text-small text-default-500 pt-4 sm:pt-1'>{doc.description}</p>
                    {doc.dbDocument && (
                      <div className='mt-2 space-y-2'>
                        {doc.dbDocument.status !== 'excluido' && (
                          <div className='flex items-center gap-2 text-tiny text-default-400'>
                            Archivo:
                            <Tooltip
                              content={
                                <div className='text-left'>
                                  <p>Cargado el: {format(new Date(doc.dbDocument.created_at), 'd MMM yyyy, HH:mm', { locale: es })}</p>
                                  {doc.dbDocument.file_size && <p>Tamaño: {(doc.dbDocument.file_size / 1024 / 1024).toFixed(2)} MB</p>}
                                </div>
                              }
                            >
                              {doc.dbDocument.original_name}
                            </Tooltip>
                          </div>
                        )}

                        <DocumentStatus status={doc.dbDocument.status} />
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex items-center self-end mt-4 sm:m-0 sm:self-auto gap-2'>
                  {doc.dbDocument && doc.dbDocument.status !== 'excluido' && doc.dbDocument.status !== 'rechazado' && (
                    <>
                      <Tooltip content='Ver documento'>
                        <Button isIconOnly color='primary' variant='ghost' onPress={() => onView(doc)}>
                          <Eye />
                        </Button>
                      </Tooltip>
                    </>
                  )}

                  {doc.dbDocument && doc.dbDocument.status === 'pendiente' && (
                    <>
                      <Tooltip content='Aceptar documento'>
                        <Button
                          color='success'
                          variant='ghost'
                          isIconOnly
                          //isLoading={processingDoc === doc.id}
                          onPress={() => onAccept(doc)}
                        >
                          <Check />
                        </Button>
                      </Tooltip>
                      <Tooltip content='Rechazar documento'>
                        <Button
                          color='danger'
                          variant='ghost'
                          isIconOnly
                          //isLoading={processingDoc === doc.id}
                          onPress={() => onReject(doc)}
                        >
                          <X />
                        </Button>
                      </Tooltip>
                    </>
                  )}

                  {!doc.dbDocument && !doc.required && (
                    <>
                      <Tooltip content='Excluir documento'>
                        <Button color='danger' isIconOnly variant='ghost' onPress={() => onExclude(doc)}>
                          <FileMinus2 />
                        </Button>
                      </Tooltip>
                      <Tooltip content='Subir documento'>
                        <Button color='primary' isIconOnly variant='ghost'>
                          <CloudUpload />
                        </Button>
                      </Tooltip>
                    </>
                  )}

                  {doc.dbDocument && doc.dbDocument.status === 'excluido' && (
                    <Tooltip content='Incluir documento'>
                      <Button color='success' isIconOnly variant='ghost' onPress={() => onInclude(doc)}>
                        <FilePlus2 />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentGroup
