import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Select,
  SelectItem,
  Snippet,
  Spinner,
  Tab,
  Tabs,
  useDisclosure
} from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Download, FileText, MessageCircleMore, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getRequiredDocuments } from '../../constants/requiredDocuments'
import { useRealtime } from '../../hooks/useRealTime'
import { supabase } from '../../lib/supabase'
import { Document } from '../../schemas/documentSchemas'
import { RootState } from '../../store'
import DocumentGroup from '../DocumentGroup'

interface ViewRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: any
  onEdit: (request: any) => void
  onGenerateRepository: (request: any) => void
}

export default function ViewRequestModal({ isOpen, onClose, request, onEdit, onGenerateRepository }: ViewRequestModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [processingDoc, setProcessingDoc] = useState<string | null>(null)
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure()
  const { isOpen: isConfirmExcludeOpen, onOpen: onConfirmExcludeOpen, onClose: onConfirmExcludeClose } = useDisclosure()
  const [documentToReject, setDocumentToReject] = useState<Document | null>(null)
  const [documentToExclude, setDocumentToExclude] = useState<Document | null>(null)
  const [rejectCause, setRejectCause] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingDownload, setProcessingDownload] = useState(false)

  const [allDocuments, setAllDocuments] = useState<any[]>([])

  const uid = useSelector((state: RootState) => state.auth.user?.id)

  const r2Api = import.meta.env.VITE_R2SERVICE_URL

  const fetchDocuments = useCallback(async () => {
    if (!request?.id) return

    try {
      setLoading(true)
      const { data: dbDocuments, error } = await supabase.from('documentos').select('*').eq('solicitud_id', request.id)

      if (error) throw error

      // Guardar todos los documentos para acceso posterior
      setAllDocuments(dbDocuments || [])

      const statusPriority: Record<string, number> = {
        rechazado: 1,
        pendiente: 2,
        revision: 3,
        aceptado: 4
      }

      setDocuments((prevDocs) =>
        prevDocs.map((doc) => {
          // Para documentos normales, encontrar el primero que coincida
          const dbDoc = dbDocuments
            ?.filter((d) => d.tipo === doc.name) // Filtrar primero
            ?.sort((a, b) => (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99)) // Ordenar según prioridad
            ?.at(0) // Tomar el primer elemento
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
  }, [request?.id])

  useEffect(() => {
    if (isOpen && request?.id) {
      const requiredDocs = getRequiredDocuments(request.tipo_credito, request.tipo_cliente).map((doc) => ({ ...doc }))
      setDocuments(requiredDocs)
      fetchDocuments()
    }
    setProcessingDoc(null)
  }, [isOpen, request?.id, fetchDocuments, processingDoc])

  useRealtime('documentos', fetchDocuments, `solicitud_id=eq.${request?.id}`)

  const handleViewDocument = async (document: Document) => {
    if (!document.dbDocument) return

    try {
      const response = await fetch(`${r2Api}/api/files/presigned-url/${document.dbDocument.url}`)
      const data = await response.json()

      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error al obtener URL del documento:', error)
    }
  }

  const handleAcceptDocument = async (document: Document) => {
    if (!document.dbDocument) return

    try {
      //setProcessingDoc(document.id)
      const { error } = await supabase.from('documentos').update({ status: 'aceptado' }).eq('id', document.dbDocument.id)

      if (error) throw error
    } catch (error) {
      console.error('Error al aceptar documento:', error)
    }
  }

  const handleOnConfirmClose = () => {
    setDocumentToReject(null)
    setRejectCause('')
    onConfirmClose()
  }

  interface SelectRejectCauseEvent {
    target: {
      value: string
    }
  }

  const handleSelectRejectCause = (e: SelectRejectCauseEvent) => {
    setRejectCause(e.target.value)
  }

  const handleRejectDocument = async () => {
    if (!documentToReject?.dbDocument) return

    try {
      // Eliminar archivo
      await fetch(`${r2Api}/api/files/${documentToReject.dbDocument.url}`, {
        method: 'DELETE'
      })

      // Actualizar estado en base de datos
      const { error } = await supabase
        .from('documentos')
        .update({ status: 'rechazado', reject_cause: rejectCause })
        .eq('id', documentToReject.dbDocument.id)

      if (error) throw error

      onConfirmClose()
      setDocumentToReject(null)
    } catch (error) {
      console.error('Error al rechazar documento:', error)
    }
  }

  const handleOnConfirmExcludeClose = () => {
    setDocumentToExclude(null)
    onConfirmExcludeClose()
  }

  const handleExcludeDocument = async () => {
    console.log('exluir:', documentToExclude)
    if (!documentToExclude) return

    try {
      const { error: insertError } = await supabase.from('documentos').insert([
        {
          solicitud_id: request.id,
          nombre: documentToExclude.id,
          tipo: documentToExclude.name,
          status: 'excluido',
          subido_por: uid
        }
      ])

      if (insertError) throw insertError

      onConfirmExcludeClose()
      setDocumentToExclude(null)
    } catch (error) {
      console.error('Error al excluir documento:', error)
    }
  }

  const handleIncludeDocument = async (document: Document) => {
    console.log('include:', document)

    if (!document.dbDocument) return

    try {
      setProcessingDoc(document.id)
      const { error } = await supabase.from('documentos').delete().eq('id', document.dbDocument.id)

      if (error) throw error
    } catch (error) {
      console.error('Error al incluir documento:', error)
    }
  }

  const handleDownloadZip = async () => {
    console.log('Descargar zip')
    setProcessingDownload(true)

    // Mapear documentos aceptados para descargar
    const mappedDocuments = allDocuments
      .filter((doc) => doc.status === 'aceptado')
      .map((doc) => {
        // Encuentra el requisito correspondiente basándose en el `tipo`
        const requirement = documents.find((req) => req.name === doc.tipo)

        return {
          url: doc.url,
          original_name: doc.original_name,
          category: requirement ? categoryTitles[requirement.category] : 'Sin categoría'
        }
      })

    console.log(mappedDocuments)

    const response = await fetch(`${r2Api}/api/download-zip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: mappedDocuments })
    })

    if (!response.ok) {
      console.error('Error al descargar el ZIP')
      return
    }

    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Expediente-${request?.id}.zip`
    link.click()

    setProcessingDownload(false)
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

  // Función para abrir WhatsApp en una nueva pestaña
  const handleWhatsAppClick = (phone: string) => {
    const phoneNumber = phone
    const whatsappUrl = `https://wa.me/+52${phoneNumber}`

    window.open(whatsappUrl, '_blank')
  }

  const requiredDocs = documents.filter((doc) => doc.required)
  const uploadedRequiredDocs = requiredDocs.filter((doc) => doc.dbDocument?.status === 'aceptado' || doc.dbDocument?.status === 'revision')
  const uploadedDocs = documents.filter((doc) => doc.dbDocument?.status === 'aceptado' || doc.dbDocument?.status === 'revision')
  const progress = Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100)

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size='3xl' scrollBehavior='inside'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className='flex justify-between w-full items-center gap-4'>
                  <div className='flex flex-col gap-1'>
                    <h3 className='text-lg font-semibold flex gap-2'>Detalles de la solicitud</h3>
                    <p className='text-small font-normal'>{request.id}</p>
                  </div>
                  <div className='flex gap-2 mr-4'>
                    <Chip
                      variant='flat'
                      size='lg'
                      color='success'
                      className='cursor-pointer'
                      startContent={<MessageCircleMore size={18} />}
                      onClick={() => handleWhatsAppClick(request.telefono)}
                    >
                      Enviar mensaje
                    </Chip>
                    <Chip variant='flat' size='lg' color={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Chip>
                  </div>
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
                        <a href={`mailto:${request.email}`} className='text-medium'>
                          {request.email}
                        </a>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Teléfono</h4>
                        <span onClick={() => handleWhatsAppClick(request.telefono)} className='text-medium cursor-pointer'>
                          {request.telefono}
                        </span>
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
                        <div className='flex gap-2'>
                          <Chip variant='flat' color='secondary'>
                            {request.tipo_credito.charAt(0).toUpperCase() + request.tipo_credito.slice(1)}
                          </Chip>
                          <Chip variant='flat' color='warning'>
                            {request.tipo_garantia?.replace('_', ' ').charAt(0).toUpperCase() +
                              request.tipo_garantia?.replace('_', ' ').slice(1) || 'Sin garantía'}
                          </Chip>
                        </div>
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
                        <p className='text-medium'>${request.monto.toLocaleString('es-MX')}</p>
                      </div>
                      <div>
                        <h4 className='text-small font-medium text-default-500'>Plazo</h4>
                        <p className='text-medium'>{request.plazo} meses</p>
                      </div>
                      {request.status === 'aprobada' && (
                        <div>
                          <h4 className='text-small font-medium text-default-500'>Pago Mensual</h4>
                          <p className='text-medium'>${request.pago_mensual.toLocaleString('es-MX')}</p>
                        </div>
                      )}
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
                    <div className='py-0 space-y-6'>
                      <div className='flex gap-4 items-center'>
                        <Snippet
                          color='primary'
                          variant='flat'
                          size='sm'
                          codeString={`${window.location.origin}/repositorio/${request.id}`}
                          tooltipProps={{
                            content: 'Copiar al portapapeles'
                          }}
                          symbol='•'
                        >
                          Copiar enlace a la solicitud
                        </Snippet>
                        <Input
                          className='flex-1'
                          placeholder='Escribe para buscar...'
                          startContent={<Search size={18} />}
                          isClearable
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClear={() => setSearchQuery('')}
                          size='md'
                        />
                      </div>
                      {loading ? (
                        <div className='text-center py-4'>
                          <Spinner color='primary' label='Cargando documentos...' labelColor='primary' />
                        </div>
                      ) : (
                        <>
                          {Object.entries(documentsByCategory).map(([category, docs]) => (
                            <DocumentGroup
                              key={category}
                              title={categoryTitles[category as keyof typeof categoryTitles]}
                              documents={docs}
                              allDocuments={allDocuments}
                              onView={handleViewDocument}
                              onAccept={handleAcceptDocument}
                              onReject={(doc) => {
                                setDocumentToReject(doc)
                                onConfirmOpen()
                              }}
                              onExclude={(doc) => {
                                setDocumentToExclude(doc)
                                onConfirmExcludeOpen()
                              }}
                              onInclude={handleIncludeDocument}
                              //searchQuery={searchQuery}
                            />
                          ))}
                        </>
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
                <div className='flex items-center justify-between gap-4'>
                  <div className='flex-1 max-w-md'>
                    <Progress label='Documentación' size='sm' value={progress} color='primary' showValueLabel />
                    <div className='flex justify-between gap-2'>
                      <span className='text-tiny text-default-500'>
                        {uploadedDocs.length} {uploadedDocs.length === 1 ? 'requisito enviado' : 'requisitos enviados'}
                      </span>
                      <span className='text-tiny text-default-500'>
                        {uploadedRequiredDocs.length} de {requiredDocs.length} requeridos
                      </span>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    {progress === 100 && (
                      <Button color='primary' variant='ghost' onPress={handleDownloadZip} isLoading={processingDownload}>
                        <Download /> Descargar expediente
                      </Button>
                    )}
                    <Button color='danger' variant='ghost' onPress={onClose}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={handleOnConfirmClose} size='sm'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar Rechazo</ModalHeader>
              <ModalBody>
                {!rejectCause && 'Para rechazar un documento primero debe elegir el motivo del rechazo.'}
                <Select className='max-w-xs' label='Razón de rechazo' selectedKeys={[rejectCause]} onChange={handleSelectRejectCause}>
                  <SelectItem key='incompleto'>Documento incompleto</SelectItem>
                  <SelectItem key='incorrecto'>Documento incorrecto</SelectItem>
                  <SelectItem key='invalido'>Documento invalido</SelectItem>
                  <SelectItem key='ilegible'>Documento ilegible</SelectItem>
                  <SelectItem key='alterado'>Documento alterado</SelectItem>
                  <SelectItem key='desactualizado'>Se necesita uno más reciente</SelectItem>
                </Select>
                {rejectCause && '¿Está seguro que desea rechazar este documento? Esta acción eliminará el archivo y no se puede deshacer.'}
              </ModalBody>
              <ModalFooter>
                <Button variant='light' onPress={onClose}>
                  Cancelar
                </Button>
                {rejectCause && (
                  <Button color='danger' onPress={handleRejectDocument}>
                    Rechazar
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal isOpen={isConfirmExcludeOpen} onClose={handleOnConfirmExcludeClose} size='sm'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar Exclusión</ModalHeader>
              <ModalBody>
                ¿Está seguro que desea excluir este documento? Esta acción hara que el documento no sea tomado en cuenta en la solicitud.
              </ModalBody>
              <ModalFooter>
                <Button variant='light' onPress={onClose}>
                  Cancelar
                </Button>
                <Button color='danger' onPress={handleExcludeDocument} isLoading={processingDoc === documentToReject?.id}>
                  Excluir
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
