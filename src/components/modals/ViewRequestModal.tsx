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
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  CloudDownload,
  Copy,
  Eye,
  EyeOff,
  FilePlus2,
  Files,
  List,
  Lock,
  LockOpen,
  MessageCircleMore,
  Search,
  Share2,
  SmilePlus
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getRequestHistoryConfig, getRequestStatusConfig } from '../../constants/creditRequests'
import { categoryTitles, getRequiredDocuments } from '../../constants/requiredDocuments'
import { useRealtime } from '../../hooks/useRealTime'
import { supabase } from '../../lib/supabase'
import { formatCurrencyCNN } from '../../lib/utils'
import { Document } from '../../schemas/documentSchemas'
import { assignRequest } from '../../services/creditRequestsService'
import { RootState } from '../../store'
import DocumentGroup from '../DocumentGroup'

interface ViewRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: any
}

export default function ViewRequestModal({ isOpen, onClose, request }: ViewRequestModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  // const [processingDoc, setProcessingDoc] = useState<string | null>(null)
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure()
  const { isOpen: isConfirmExcludeOpen, onOpen: onConfirmExcludeOpen, onClose: onConfirmExcludeClose } = useDisclosure()
  const [documentToReject, setDocumentToReject] = useState<Document | null>(null)
  const [documentToExclude, setDocumentToExclude] = useState<Document | null>(null)
  const [rejectCause, setRejectCause] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingDownload, setProcessingDownload] = useState(false)

  const [isCompleted, setIsCompleted] = useState(false)

  const [requestData, setRequestData] = useState<any>({}) //TODO: Cambiar a tipo de dato correcto
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [requestHistory, setRequestHistory] = useState<any>({}) //TODO: Cambiar a tipo de dato correcto
  const [loadingRequestHistory, setLoadingRequestHistory] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([]) //TODO: Cambiar a tipo de dato correcto

  const [allDocuments, setAllDocuments] = useState<any[]>([])

  const [isVisible, setIsVisible] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockPassword, setLockPassword] = useState('')

  const [canShareFiles, setCanShareFiles] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)
  const toggleLock = () => setIsLocked(!isLocked)

  const uid = useSelector((state: RootState) => state.auth.user?.id)

  const r2Api = import.meta.env.VITE_R2SERVICE_URL

  const fetchDocuments = useCallback(async () => {
    if (!request?.id) return

    console.table(request)

    try {
      setLoadingDocs(true)
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
      setLoadingDocs(false)
    }
  }, [request?.id])

  const fetchRequest = useCallback(async () => {
    setLoadingRequest(true)
    if (!request?.id) return

    try {
      const { data, error } = await supabase.from('solicitudes_with_user_name').select('*').eq('id', request.id).single()
      if (error) throw error
      setRequestData(data)
    } catch (error) {
      console.error('Error al cargar solicitud:', error)
    } finally {
      setLoadingRequest(false)
    }
  }, [request?.id])

  const fetchHistory = useCallback(async () => {
    if (!request?.id) return
    try {
      const { data, error } = await supabase.from('request_history').select('*').eq('request_id', request.id)
      if (error) throw error
      setHistoryData(data)
    } catch (error) {
      console.error('Error al cargar el historial:', error)
    }
  }, [request?.id])

  useEffect(() => {
    if (isLocked) {
      if (lockPassword.length === 0) {
        //Generar password aleatorio de 8 caracteres
        let password = ''
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let charactersLength = characters.length
        for (let i = 0; i < 8; i++) {
          password += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        setLockPassword(password)
      }
    } else setLockPassword('')
  }, [isLocked])

  useEffect(() => {
    if (isOpen && request?.id) {
      const requiredDocs = getRequiredDocuments(request.tipo_credito, request.tipo_cliente).map((doc) => ({ ...doc }))
      setDocuments(requiredDocs)

      fetchDocuments()
      fetchRequest()
      fetchHistory()
    }
  }, [isOpen, request?.id, fetchDocuments])

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
      // Actualizar estado en base de datos
      const { error } = await supabase
        .from('documentos')
        .update({ status: 'rechazado', reject_cause: rejectCause })
        .eq('id', documentToReject.dbDocument.id)

      if (error) throw error

      onConfirmClose()
      setRejectCause('')
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
      //setProcessingDoc(document.id)
      const { error } = await supabase.from('documentos').delete().eq('id', document.dbDocument.id)

      //TODO: Revisar por que la suscripcion realtime no ejecuta el fetchDocuments
      fetchDocuments()

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

    console.log(request)

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
    link.download = `${format(new Date(request.updated_at), 'ddMMyy')}-${request?.nombre}(Crédito ${
      request?.tipo_credito
    } ${request?.credit_conditions.replace('-', ' ')})-${formatCurrencyCNN(request?.monto)}.zip`
    link.click()

    setProcessingDownload(false)
  }

  const handleShareZip = async () => {
    console.log('Compartir zip')

    if (navigator.share && typeof navigator.share === 'function') {
      navigator
        .share({
          title: 'Mi Archivo',
          text: 'Te comparto los documentos de la solicitud de credito de Juan Perez',
          url: 'https://miarchivo.com/archivo.zip'
        })
        .then(() => console.log('Compartido con éxito'))
        .catch((error) => console.log('Error al compartir:', error))
    }
  }

  const handleCompleteRequest = async () => {
    if (!request) return
    if (request.status === 'completada') return

    try {
      const { error } = await supabase.from('solicitudes').update({ status: 'completada' }).eq('id', request.id)

      fetchRequest()

      if (error) throw error
    } catch (error) {
      console.error('Error al completar solicitud:', error)
    }
  }

  const filteredDocuments = useCallback(() => {
    if (!searchQuery) return documents

    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.dbDocument?.original_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [documents, searchQuery])

  const documentsByCategory = useCallback(() => {
    const filtered = filteredDocuments()

    // Group documents by category
    const grouped = filtered.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = []
      }
      acc[doc.category].push(doc)
      return acc
    }, {} as Record<string, Document[]>)

    // Filter out empty categories
    return Object.fromEntries(Object.entries(grouped).filter(([_, docs]) => docs.length > 0))
  }, [filteredDocuments])

  // Función para abrir WhatsApp en una nueva pestaña
  const handleWhatsAppClick = async (phone: string) => {
    //Revisamos si la soliciud esta asignada a un asesor
    console.log('solicitud actual', requestData)

    if (!requestData.assigned_to) {
      if (uid) {
        await assignRequest(requestData.id, uid)
        //recargar la solicitud
        fetchRequest()
      } else {
        //Si no hay usuario logueado, no se puede asignar
        return
      }
      console.log('solicitud asignada:', uid)
    }

    //console.log(request)

    const phoneNumber = phone
    const whatsappUrl = `https://wa.me/+52${phoneNumber}`

    window.open(whatsappUrl, '_blank')
  }

  const requiredDocs = documents.filter((doc) => doc.required)
  const acceptedDocs = requiredDocs.filter((doc) => doc.dbDocument?.status === 'aceptado')

  const uploadedDocs = documents.filter((doc) => doc.dbDocument?.status === 'aceptado' || doc.dbDocument?.status === 'revision')
  const progress = Math.round((acceptedDocs.length / requiredDocs.length) * 100)

  useEffect(() => {
    if (progress === 100 && !isCompleted) {
      handleCompleteRequest()
      setIsCompleted(true)
    }
  }, [progress])

  useEffect(() => {
    if (!isOpen) {
      // Resetea el estado de completado al cerrar el modal
      setIsCompleted(false)
    }

    if (navigator.share && typeof navigator.share === 'function') {
      setCanShareFiles(true)
    } else {
      console.log('Cannot share files')
    }
  }, [isOpen])

  if (loadingRequest) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size='3xl' scrollBehavior='inside'>
        <ModalContent>
          <ModalBody>
            <div className='text-center py-4'>
              <Spinner color='primary' label='Cargando solicitud...' labelColor='primary' />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  if (!request) {
    return null
  }
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size='3xl' scrollBehavior='inside'>
        <ModalContent>
          {(onClose) => (
            <>
              {Object.keys(requestData).length > 0 && (
                <ModalHeader>
                  <div className='flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4'>
                    <div className='flex flex-col gap-1'>
                      <h3 className='text-xl font-semibold flex gap-2'>Detalles de la solicitud</h3>

                      <div className='text-sm text-default-500'>
                        {requestData.assigned_to && (
                          <div className='flex font-normal gap-2'>
                            Asignada a:
                            <span className='font-semibold'>{requestData.assigned_to}</span>
                          </div>
                        )}
                        <div className='flex gap-2 mt-2'>
                          {(() => {
                            const statusConfig = getRequestStatusConfig(request.status) // Obtiene la config del estado
                            const Icon = statusConfig.icon // Extrae el icono

                            return (
                              <Chip
                                startContent={<Icon className='pl-2' />}
                                variant='bordered'
                                color={statusConfig.color}
                                className='items-center'
                              >
                                {statusConfig.text}
                              </Chip>
                            )
                          })()}
                          {isLocked ? (
                            <Chip variant='flat' color='success' startContent={<Lock size={16} />} className='pl-3'>
                              Acceso restringido
                            </Chip>
                          ) : (
                            <Chip variant='flat' color='warning' startContent={<LockOpen size={16} />} className='pl-3'>
                              Acceso público
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex gap-2 mr-4'>
                      <Chip
                        size='lg'
                        color='success'
                        className='cursor-pointer text-white pl-4 py-5 text-medium'
                        startContent={<MessageCircleMore size={18} />}
                        onClick={() => handleWhatsAppClick(request.telefono)}
                      >
                        Enviar mensaje
                      </Chip>
                    </div>
                  </div>
                </ModalHeader>
              )}
              <ModalBody>
                <Tabs aria-label='Detalles de la solicitud' disableAnimation>
                  <Tab
                    key='details'
                    title={
                      <div className='flex items-center gap-2'>
                        <List size={18} />
                        <span>Detalles</span>
                      </div>
                    }
                  >
                    <div className='grid grid-cols-2 gap-4 py-4'>
                      <div className='col-span-2 sm:col-span-1'>
                        <h4 className='text-small font-medium text-default-500'>Solicitante</h4>
                        <p className='text-medium'>{request.nombre}</p>
                      </div>
                      <div className='col-span-2 sm:col-span-1'>
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

                          {request.credit_conditions && (
                            <Chip variant='flat' color='warning'>
                              {request.credit_conditions?.replace('-', ' ').charAt(0).toUpperCase() +
                                request.credit_conditions?.replace('-', ' ').slice(1)}
                            </Chip>
                          )}
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
                      {request.credit_destination && (
                        <div>
                          <h4 className='text-small font-medium text-default-500'>Destino del crédito</h4>
                          <p className='text-medium'>{request.credit_destination}</p>
                        </div>
                      )}
                      {request.clave_ciec && (
                        <div>
                          <p className='text-medium'>
                            <Input
                              name='request-pass'
                              className='w-44 pr-0'
                              description='Clave CIEC'
                              endContent={
                                <Button variant='light' isIconOnly aria-label='toggle lock' className='focus:outline-none' type='button'>
                                  <Copy size={18} />
                                </Button>
                              }
                              startContent={
                                <button
                                  aria-label='toggle password visibility'
                                  className={`focus:outline-none `}
                                  type='button'
                                  onClick={toggleVisibility}
                                >
                                  {isVisible ? <EyeOff /> : <Eye />}
                                </button>
                              }
                              type={isVisible ? 'text' : 'password'}
                              variant='bordered'
                              placeholder='Abierto'
                              autoComplete='destination'
                              maxLength={8}
                              minLength={8}
                              value={request.clave_ciec}
                              readOnly
                              //onChange={(e) => setLockPassword(e.target.value)}
                            />
                          </p>
                        </div>
                      )}
                    </div>
                  </Tab>
                  {request.status !== 'cancelada' && request.status !== 'rechazada' && (
                    <Tab
                      key='documents'
                      title={
                        <div className='flex items-center gap-2'>
                          <Files size={18} />
                          <span>Documentos</span>
                        </div>
                      }
                    >
                      <div className='py-0 space-y-6'>
                        <div className='flex flex-wrap  gap-4 items-center'>
                          <Snippet
                            color='primary'
                            variant='flat'
                            codeString={`${window.location.origin}/solicitud/${request.id}`}
                            tooltipProps={{
                              content: 'Copiar al portapapeles'
                            }}
                            symbol=''
                            className='pl-4 order-2 sm:order-1 w-full sm:w-auto'
                          >
                            Copiar enlace a la solicitud
                          </Snippet>
                          <Input
                            name='request-pass'
                            className='w-44 order-1'
                            startContent={
                              <button aria-label='toggle lock' className='focus:outline-none' type='button' onClick={toggleLock}>
                                {isLocked ? <Lock /> : <LockOpen />}
                              </button>
                            }
                            endContent={
                              <button
                                aria-label='toggle password visibility'
                                className={`focus:outline-none ${lockPassword.length === 0 ? 'hidden' : ''}`}
                                type='button'
                                onClick={toggleVisibility}
                              >
                                {isVisible ? <EyeOff /> : <Eye />}
                              </button>
                            }
                            type={isVisible ? 'text' : 'password'}
                            variant='bordered'
                            placeholder='Abierto'
                            isRequired
                            autoComplete='destination'
                            maxLength={8}
                            disabled={isLocked}
                            value={lockPassword}
                            onChange={(e) => setLockPassword(e.target.value)}
                          />
                          <Input
                            className='flex-0 sm:flex-1 order-3'
                            placeholder='Escribe para buscar...'
                            startContent={<Search size={18} />}
                            isClearable
                            variant='bordered'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClear={() => setSearchQuery('')}
                            size='md'
                          />
                        </div>
                        {loadingDocs ? (
                          <div className='text-center py-4'>
                            <Spinner color='primary' label='Cargando documentos...' labelColor='primary' />
                          </div>
                        ) : (
                          <>
                            {Object.entries(documentsByCategory()).map(([category, docs]) => (
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
                                searchQuery={searchQuery}
                              />
                            ))}
                            {Object.keys(documentsByCategory()).length === 0 && (
                              <div className='text-center py-8 text-default-500'>
                                No se encontraron documentos que coincidan con la búsqueda
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Tab>
                  )}

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
                        <div className='flex gap-2 items-center'>
                          <SmilePlus size={30} className='flex-none text-primary' />
                          <div className='flex-col'>
                            <p>Solicitud creada</p>
                            <p className='text-small'>{format(new Date(request.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}</p>
                          </div>
                        </div>
                        {historyData.map((history) => {
                          const eventConfig = getRequestHistoryConfig(history.event) || {
                            color: 'gray',
                            icon: FilePlus2,
                            text: 'Evento desconocido'
                          } // Fallback en caso de que no haya configuración para el evento

                          const IconComponent = eventConfig.icon

                          return (
                            <div key={history.id} className={`flex gap-2 items-center `}>
                              <IconComponent size={30} className={`flex-none text-${eventConfig.color}`} />
                              <div className='flex-col'>
                                <p>{eventConfig.text}</p>
                                <p className='text-small'>{history.description}</p>
                                <p className='text-small'>
                                  {history.action} el {format(new Date(history.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                                </p>
                              </div>
                            </div>
                          )
                        })}

                        {request.updated_at !== request.created_at && (
                          <div className='flex gap-2 items-center'>
                            <CalendarClock className='flex-none text-primary' />
                            <div className='flex-col'>
                              <p>Última actualización</p>
                              <p className='text-small'>
                                {' '}
                                {format(new Date(request.updated_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>
              <div className='px-6 py-4 border-t border-default-200 dark:border-default-100'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                  {/* Contenedor de Progreso */}
                  <div className='flex-1 max-w-md sm:w-full'>
                    {request.status !== 'cancelada' && request.status !== 'rechazada' ? (
                      <>
                        <Progress label='Documentación' size='sm' value={progress} color='primary' showValueLabel />
                        <div className='flex justify-between gap-2'>
                          <span className='text-tiny text-default-500'>
                            {uploadedDocs.length} {uploadedDocs.length === 1 ? 'requisito enviado' : 'requisitos enviados'}
                          </span>
                          <span className='text-tiny text-default-500'>
                            {acceptedDocs.length} de {requiredDocs.length} requeridos
                          </span>
                        </div>
                      </>
                    ) : (
                      // Motivo de la cancelación
                      <div className='flex gap-2 text-danger'>
                        <AlertTriangle size={24} /> Motivo de la cancelacion: Tal cosa
                      </div>
                    )}
                  </div>

                  {/* Contenedor de Botones */}
                  <div className='flex gap-2 justify-between w-full sm:w-auto'>
                    {progress === 100 && (
                      <>
                        <Button color='primary' variant='ghost' onPress={handleDownloadZip} isLoading={processingDownload}>
                          <CloudDownload /> Descargar
                        </Button>
                        {canShareFiles && (
                          <Button color='secondary' variant='ghost' onPress={handleShareZip} isLoading={processingDownload}>
                            <Share2 /> Compartir
                          </Button>
                        )}
                      </>
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
                <Button color='danger' onPress={handleExcludeDocument}>
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
