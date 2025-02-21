import {
  Button,
  Card,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Tab,
  Tabs,
  useDisclosure
} from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, CheckCircle2, Clock, Eye, FileText, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getRequiredDocuments, type RequiredDocument } from '../../constants/requiredDocuments'
import { supabase } from '../../lib/supabase'

interface ViewRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: any
  onEdit: (request: any) => void
  onGenerateRepository: (request: any) => void
}

interface Document extends RequiredDocument {
  dbDocument?: {
    id: string
    nombre: string
    url: string
    status: 'pendiente' | 'aceptado' | 'rechazado'
    created_at: string
  }
}

export default function ViewRequestModal({ isOpen, onClose, request, onEdit, onGenerateRepository }: ViewRequestModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [processingDoc, setProcessingDoc] = useState<string | null>(null)
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure()
  const [documentToReject, setDocumentToReject] = useState<Document | null>(null)

  useEffect(() => {
    if (isOpen && request?.id) {
      // Obtener documentos requeridos según el tipo de crédito y cliente
      const requiredDocs = getRequiredDocuments(request.tipo_credito, request.tipo_cliente).map((doc) => ({ ...doc }))
      setDocuments(requiredDocs)
      fetchDocuments()
      subscribeToDocuments()
    }
  }, [isOpen, request?.id])

  const fetchDocuments = async () => {
    if (!request?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase.from('documentos').select('*').eq('solicitud_id', request.id)

      if (error) throw error

      // Actualizar los documentos con la información de la base de datos
      setDocuments((prevDocs) =>
        prevDocs.map((doc) => {
          const dbDoc = data?.find((d) => d.tipo === doc.name)
          return {
            ...doc,
            dbDocument: dbDoc || undefined
          }
        })
      )
    } catch (error) {
      console.error('Error al cargar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToDocuments = () => {
    if (!request?.id) return

    const channel = supabase
      .channel(`documents-${request.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documentos',
          filter: `solicitud_id=eq.${request.id}`
        },
        () => {
          fetchDocuments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleViewDocument = async (document: Document) => {
    if (!document.dbDocument) return

    try {
      setProcessingDoc(document.id)
      const response = await fetch(`http://3.90.27.51:3000/files/presigned-url/${document.dbDocument.url}`)
      const data = await response.json()

      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error al obtener URL del documento:', error)
    } finally {
      setProcessingDoc(null)
    }
  }

  const handleAcceptDocument = async (document: Document) => {
    if (!document.dbDocument) return

    try {
      setProcessingDoc(document.id)
      const { error } = await supabase.from('documentos').update({ status: 'aceptado' }).eq('id', document.dbDocument.id)

      if (error) throw error
    } catch (error) {
      console.error('Error al aceptar documento:', error)
    } finally {
      setProcessingDoc(null)
    }
  }

  const handleRejectDocument = async () => {
    if (!documentToReject?.dbDocument) return

    try {
      setProcessingDoc(documentToReject.id)

      // Eliminar archivo
      await fetch(`http://3.90.27.51:3000/files/${documentToReject.dbDocument.url}`, {
        method: 'DELETE'
      })

      // Actualizar estado en base de datos
      const { error } = await supabase.from('documentos').update({ status: 'rechazado' }).eq('id', documentToReject.dbDocument.id)

      if (error) throw error

      onConfirmClose()
      setDocumentToReject(null)
    } catch (error) {
      console.error('Error al rechazar documento:', error)
    } finally {
      setProcessingDoc(null)
    }
  }

  const getStatusConfig = (status: string) => {
    const config = {
      pendiente: {
        color: 'warning' as const,
        icon: AlertTriangle,
        text: 'En revisión'
      },
      aceptado: {
        color: 'success' as const,
        icon: CheckCircle2,
        text: 'Aceptado'
      },
      rechazado: {
        color: 'danger' as const,
        icon: XCircle,
        text: 'Rechazado'
      }
    }
    return config[status as keyof typeof config]
  }

  // Calcular el progreso de documentos
  const calculateProgress = () => {
    const requiredDocs = documents.filter((doc) => doc.required)
    const uploadedRequiredDocs = requiredDocs.filter(
      (doc) => doc.dbDocument?.status === 'aceptado' || doc.dbDocument?.status === 'pendiente'
    )

    return {
      total: requiredDocs.length,
      uploaded: uploadedRequiredDocs.length,
      percentage: Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100)
    }
  }

  if (!request) return null

  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = []
    }
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  const categoryTitles = {
    identification: 'Identificación',
    financial: 'Financieros',
    property: 'Propiedad',
    business: 'Empresariales',
    guarantees: 'Garantías'
  }

  const progress = calculateProgress()

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size='3xl' scrollBehavior='inside'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className='flex flex-col gap-1'>
                  <h3 className='text-lg font-semibold'>Solicitud #{request.id}</h3>
                  <p className='text-small text-default-500'>
                    Creada el {format(new Date(request.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody>
                <Tabs aria-label='Detalles de la solicitud' disableAnimation>
                  <Tab
                    key='details'
                    title={
                      <div className='flex items-center gap-2'>
                        <FileText size={18} />
                        <span>Detalles</span>
                      </div>
                    }
                  >
                    <div className='grid grid-cols-2 gap-4 py-4'>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Solicitante</h4>
                        <p className='text-medium'>{request.nombre}</p>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Email</h4>
                        <p className='text-medium'>{request.email}</p>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Teléfono</h4>
                        <p className='text-medium'>{request.telefono}</p>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>RFC</h4>
                        <p className='text-medium'>{request.rfc}</p>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Tipo de Cliente</h4>
                        <Chip variant='flat' color='primary'>
                          {request.tipo_cliente === 'personal' ? 'Personal' : 'Empresarial'}
                        </Chip>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Tipo de Crédito</h4>
                        <Chip variant='flat' color='secondary'>
                          {request.tipo_credito.charAt(0).toUpperCase() + request.tipo_credito.slice(1)}
                        </Chip>
                      </div>
                      {request.tipo_cliente === 'empresarial' && (
                        <>
                          <div>
                            <h4 className='text-small font-medium text-default-500'>Empresa</h4>
                            <p className='text-medium'>{request.nombre_empresa}</p>
                          </div>
                          <div>
                            <h4 className='text-small font-medium text-default-500'>Industria</h4>
                            <p className='text-medium'>{request.industria}</p>
                          </div>
                          <div>
                            <h4 className='text-small font-medium text-default-500'>Ingresos Anuales</h4>
                            <p className='text-medium'>${request.ingresos_anuales?.toLocaleString('es-ES')}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Monto Solicitado</h4>
                        <p className='text-medium'>${request.monto.toLocaleString('es-ES')}</p>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Plazo</h4>
                        <p className='text-medium'>{request.plazo} meses</p>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Pago Mensual</h4>
                        <p className='text-medium'>${request.pago_mensual.toLocaleString('es-ES')}</p>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Tipo de Garantía</h4>
                        <Chip variant='flat' color='warning'>
                          {request.tipo_garantia?.replace('_', ' ').charAt(0).toUpperCase() +
                            request.tipo_garantia?.replace('_', ' ').slice(1) || 'Sin garantía'}
                        </Chip>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Estado</h4>
                        <Chip variant='flat' color={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Chip>
                      </div>
                    </div>
                  </Tab>
                  <Tab
                    key='documents'
                    title={
                      <div className='flex items-center gap-2'>
                        <FileText size={18} />
                        <span>Documentos</span>
                      </div>
                    }
                  >
                    <div className='py-4 space-y-6'>
                      {loading ? (
                        <div className='text-center py-4'>Cargando documentos...</div>
                      ) : (
                        Object.entries(documentsByCategory).map(([category, docs]) => (
                          <div key={category} className='space-y-4'>
                            <h3 className='text-lg font-semibold'>{categoryTitles[category as keyof typeof categoryTitles]}</h3>
                            <div className='space-y-4'>
                              {docs.map((doc) => {
                                const statusConfig = doc.dbDocument ? getStatusConfig(doc.dbDocument.status) : null
                                return (
                                  <Card key={doc.id} className='p-4'>
                                    <div className='flex items-center justify-between'>
                                      <div className='space-y-2'>
                                        <div className='flex items-center gap-2'>
                                          <FileText size={20} className='text-default-500' />
                                          <div>
                                            <div className='flex items-center gap-2'>
                                              <p className='font-medium'>{doc.name}</p>
                                              {doc.required && (
                                                <Chip size='sm' variant='flat' color='danger'>
                                                  Requerido
                                                </Chip>
                                              )}
                                            </div>
                                            <p className='text-small text-default-500'>{doc.description}</p>
                                            {doc.dbDocument && (
                                              <p className='text-tiny text-default-400'>Archivo: {doc.dbDocument.nombre}</p>
                                            )}
                                          </div>
                                        </div>
                                        {statusConfig && (
                                          <div className='flex items-center gap-2'>
                                            <Chip startContent={<statusConfig.icon size={16} />} variant='flat' color={statusConfig.color}>
                                              {statusConfig.text}
                                            </Chip>
                                            {doc.dbDocument && (
                                              <span className='text-tiny text-default-400'>
                                                {format(new Date(doc.dbDocument.created_at), 'd MMM yyyy, HH:mm', { locale: es })}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {doc.dbDocument && (
                                        <div className='flex gap-2'>
                                          <Button
                                            size='sm'
                                            variant='flat'
                                            startContent={<Eye size={16} />}
                                            isLoading={processingDoc === doc.id}
                                            onPress={() => handleViewDocument(doc)}
                                          >
                                            Ver
                                          </Button>
                                          {doc.dbDocument.status === 'pendiente' && (
                                            <>
                                              <Button
                                                size='sm'
                                                color='success'
                                                variant='flat'
                                                startContent={<CheckCircle2 size={16} />}
                                                isLoading={processingDoc === doc.id}
                                                onPress={() => handleAcceptDocument(doc)}
                                              >
                                                Aceptar
                                              </Button>
                                              <Button
                                                size='sm'
                                                color='danger'
                                                variant='flat'
                                                startContent={<XCircle size={16} />}
                                                isLoading={processingDoc === doc.id}
                                                onPress={() => {
                                                  setDocumentToReject(doc)
                                                  onConfirmOpen()
                                                }}
                                              >
                                                Rechazar
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Tab>
                  <Tab
                    key='history'
                    title={
                      <div className='flex items-center gap-2'>
                        <Clock size={18} />
                        <span>Historial</span>
                      </div>
                    }
                  >
                    <div className='py-4'>
                      <div className='space-y-4'>
                        <div className='flex items-center gap-2'>
                          <div className='w-2 h-2 rounded-full bg-success'></div>
                          <p className='text-small'>
                            Solicitud creada el {format(new Date(request.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                        {request.updated_at !== request.created_at && (
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-primary'></div>
                            <p className='text-small'>
                              Última actualización el {format(new Date(request.updated_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>
              <div className='px-6 py-4 border-t border-default-200 dark:border-default-100'>
                <div className='flex items-center gap-4'>
                  <div className='flex-1'>
                    <Progress size='sm' value={progress.percentage} color='primary' showValueLabel className='max-w-md' />
                    <p className='text-small text-default-500 mt-2'>
                      {progress.uploaded} de {progress.total} documentos requeridos subidos
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='light' onPress={onClose}>
                      Cerrar
                    </Button>
                    <Button
                      color='primary'
                      onPress={() => {
                        onClose()
                        onEdit(request)
                      }}
                    >
                      Editar Solicitud
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} size='sm'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar Rechazo</ModalHeader>
              <ModalBody>
                ¿Está seguro que desea rechazar este documento? Esta acción eliminará el archivo y no se puede deshacer.
              </ModalBody>
              <ModalFooter>
                <Button variant='light' onPress={onClose}>
                  Cancelar
                </Button>
                <Button color='danger' onPress={handleRejectDocument} isLoading={processingDoc === documentToReject?.id}>
                  Rechazar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}

function getStatusColor(status: string) {
  const statusColorMap: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
    pendiente: 'default',
    en_revision: 'primary',
    aprobada: 'success',
    rechazada: 'danger',
    cancelada: 'warning'
  }
  return statusColorMap[status] || 'default'
}
