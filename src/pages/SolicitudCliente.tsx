import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Spinner,
  Tab,
  Tabs,
  useDisclosure
} from '@nextui-org/react'
import { motion } from 'framer-motion'
import {
  BellOff,
  BellRing,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  CircleHelp,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  FileWarning,
  FileX,
  Filter,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  TriangleAlert,
  Upload,
  UploadCloud
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import img404 from '../assets/404.png'
import logo from '../assets/branding/logo.svg'
import DocumentFile from '../components/DocumentFile'
import UploadDocumentModal from '../components/modals/UploadDocumentModal'
import PusherSetup from '../components/PusherSetup'
import { creditDestinations, getRequestStatusConfig } from '../constants/creditRequests'
import { categoryTitles, getRequiredDocuments } from '../constants/requiredDocuments'
import { useIsMobile } from '../hooks/useIsMobile'
import { useRealtime } from '../hooks/useRealTime'
import { uploadToR2 } from '../lib/cloudflare'
import { supabase } from '../lib/supabase'
import { Document } from '../schemas/documentSchemas'

const DocumentGroup = ({
  title,
  documents,
  onUpload,

  onView,
  onDelete,
  onSendToReview,
  allDocuments
}: {
  title: string
  documents: Document[]
  onUpload: (docId: string) => void

  onView: (doc: Document) => void
  onSendToReview: (doc: Document) => void
  onDelete: (doc: Document) => void

  allDocuments: any[]
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  // Función para verificar si un documento tiene múltiples archivos cargados o rechazados
  const hasMultipleFiles = (doc: Document) => {
    let filesPending = false
    let filesRejected = false

    getDocumentFiles(doc).map((file) => {
      if (file.status === 'pendiente') {
        filesPending = true
      }
      if (file.status === 'rechazado') {
        filesRejected = true
      }
    })
    if (doc.multipleFiles) return { pending: filesPending, rejected: filesRejected }
  }

  // Función para obtener todos los documentos de un tipo específico
  const getDocumentFiles = (doc: Document) => {
    if (!doc.multipleFiles) return []
    return allDocuments.filter((d) => d.tipo === doc.name) //.sort((a, b) => (a.status || '').localeCompare(b.status || ''))
  }

  // Verificar si un documento tiene múltiples archivos subidos
  const hasMultipleUploads = (doc: Document) => {
    const files = getDocumentFiles(doc)
    return doc.multipleFiles && files.length > 0
  }

  const handleFocusCIEC = () => {}

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
              <div className='flex flex-col'>
                <div className='flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4'>
                  <div className='flex items-center gap-2'>
                    {doc.dbDocument?.status === 'aceptado' ? (
                      <FileCheck className='text-success' size={24} />
                    ) : doc.dbDocument?.status === 'rechazado' ? (
                      <FileX className='text-danger' size={24} />
                    ) : doc.dbDocument?.status === 'revision' ? (
                      <FileWarning className='text-warning' size={24} />
                    ) : (
                      // Caso por defecto
                      <FileText className='text-primary' size={24} />
                    )}
                    <h3 className='text-medium font-semibold flex justify-between sm:justify-start items-center gap-2'>{doc.name}</h3>
                  </div>
                  <div className='flex gap-2 items-center'>
                    {doc.required && (
                      <Chip size='sm' variant='light' color='danger' startContent={<TriangleAlert size={16} className='mr-1' />}>
                        Requerido
                      </Chip>
                    )}
                    {doc.multipleFiles && (
                      <Chip size='sm' variant='light' color='secondary'>
                        Múltiples archivos
                      </Chip>
                    )}
                  </div>
                </div>
                <div className='flex flex-col items-start justify-between gap-4'>
                  <div className='w-full'>
                    <p className='text-small text-default-500 pt-4 sm:pt-1'>{doc.description}</p>

                    {/* Mostrar un solo documento si no es multipleFiles */}
                    {doc.dbDocument && !doc.multipleFiles && (
                      <div className='space-y-1 mt-3'>
                        <p className='text-small font-medium'>Archivo cargado:</p>
                        <div className='max-h-60 overflow-y-auto space-y-1 p-2 border rounded-lg border-default-100'>
                          <DocumentFile
                            key={doc.dbDocument.id}
                            file={doc.dbDocument}
                            onView={() => {
                              const docWithFile = { ...doc, dbDocument: doc.dbDocument }
                              onView(docWithFile)
                            }}
                            onDelete={() => {
                              const docWithFile = { ...doc, dbDocument: doc.dbDocument }
                              onDelete(docWithFile)
                            }}
                            isClient
                          />
                        </div>
                      </div>
                    )}

                    {/* Mostrar múltiples documentos si es multipleFiles */}
                    {doc.multipleFiles && (
                      <div className='mt-2'>
                        {hasMultipleUploads(doc) && (
                          <div className='space-y-1 mt-3'>
                            <p className='text-small font-medium'>Archivos cargados:</p>
                            <div className='max-h-60 overflow-y-auto space-y-1 p-2 border rounded-lg border-default-100'>
                              {getDocumentFiles(doc).map((file) => (
                                <DocumentFile
                                  key={file.id}
                                  file={file}
                                  onView={() => {
                                    const docWithFile = { ...doc, dbDocument: file }
                                    onView(docWithFile)
                                  }}
                                  onDelete={() => {
                                    const docWithFile = { ...doc, dbDocument: file }
                                    onDelete(docWithFile)
                                  }}
                                  isClient
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className='flex items-center place-self-center sm:place-self-end   gap-2'>
                    {hasMultipleFiles(doc)?.pending && (
                      <Button color='success' variant='ghost' onPress={() => onSendToReview(doc)}>
                        <CircleCheckBig />
                        Enviar a revisión
                      </Button>
                    )}

                    {hasMultipleFiles(doc) ? (
                      <>
                        {doc.dbDocument?.status !== 'aceptado' && (
                          <Button color='primary' variant='ghost' onPress={() => onUpload(doc.id)}>
                            <UploadCloud /> Agregar
                          </Button>
                        )}
                      </>
                    ) : (
                      (!doc.dbDocument || doc.dbDocument?.status === 'rechazado') && (
                        <Button color='primary' variant='ghost' onPress={() => onUpload(doc.id)}>
                          <UploadCloud /> {doc.dbDocument ? 'Cargar de nuevo' : 'Cargar'}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SolicitudCliente() {
  const { requestId } = useParams()
  const [selectedTab, setSelectedTab] = useState('details')
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [allDocuments, setAllDocuments] = useState<any[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<keyof typeof categoryTitles | 'all'>('all')
  const [isMultipleUpload, setIsMultipleUpload] = useState(false)
  const inputCIECRef = useRef<HTMLInputElement>(null)
  const [claveCIEC, setClaveCiec] = useState<string | null>(null)
  const [destinoCredito, setDestinoCredito] = useState<string | null>(null)
  const [totalProgress, setTotalProgress] = useState(0)

  const [isDeleted, setIsDeleted] = useState(false)

  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  const r2Api = import.meta.env.VITE_R2SERVICE_URL // Cloudflare Worker API

  const isMobile = useIsMobile()

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase.from('solicitudes').select('*').eq('id', requestId).single()
      if (error) throw error
      setRequest(data)
    } catch (error) {
      console.error('Error al obtener la solicitud:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequest()

    const timer = setTimeout(() => {
      if (inputCIECRef.current) {
        inputCIECRef.current.removeAttribute('readOnly')
      }
    }, 1000)
  }, [requestId])

  useEffect(() => {
    if (request) {
      const requiredDocs = getRequiredDocuments(
        request.tipo_credito,
        request.tipo_cliente,
        ...(request.credit_conditions ? [request.credit_conditions] : []) // Solo lo pasa si no es null o undefined
      ).map((doc) => ({ ...doc }))

      console.log(requiredDocs)

      setDocuments(requiredDocs)
      setClaveCiec(request.clave_ciec)
    }
  }, [request])

  const parentRef = useRef<HTMLDivElement>(null) // Referencia al contenedor padre
  const [parentWidth, setParentWidth] = useState(0) // Estado para almacenar el ancho del padre

  // Efecto para calcular el ancho del padre
  useEffect(() => {
    if (parentRef.current) {
      const width = parentRef.current.getBoundingClientRect().width
      setParentWidth(width)
    }

    // Escuchar cambios en el tamaño de la ventana para recalcular el ancho
    const handleResize = () => {
      if (parentRef.current) {
        const width = parentRef.current.getBoundingClientRect().width
        setParentWidth(width)
      }
    }

    fetchDocuments()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedTab])

  useEffect(() => {
    setTotalProgress(Math.round((documents.filter((doc) => doc.dbDocument?.status === 'aceptado').length / documents.length) * 100))
  }, [documents])

  const fetchDocuments = useCallback(async () => {
    try {
      const { data: dbDocuments, error } = await supabase.from('documentos').select('*').eq('solicitud_id', requestId)
      if (error) throw error

      // Guardar todos los documentos para acceso posterior
      setAllDocuments(dbDocuments || [])

      const statusPriority: Record<string, number> = {
        rechazado: 1,
        revision: 2,
        pendiente: 3,
        aceptado: 4
      }

      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) => {
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
      console.error('Error al obtener los documentos:', error)
    }
  }, [requestId])

  useRealtime('documentos', fetchDocuments)

  interface HandleChangeClaveCIECEvent extends React.FormEvent<HTMLFormElement> {}
  const handleUpdateRequest = async (e: HandleChangeClaveCIECEvent): Promise<void> => {
    e.preventDefault()

    const newCIEC = inputCIECRef.current?.value
    if (!newCIEC) return

    if (destinoCredito) {
      try {
        const { error } = await supabase
          .from('solicitudes')
          .update({ clave_ciec: newCIEC, credit_destination: creditDestinations.find((item) => item.key === destinoCredito)?.label })
          .eq('id', requestId)
        if (error) throw error
      } catch (error) {
        console.error('Error al actualizar la clave CIEC:', error)
      }
    } else {
      try {
        const { error } = await supabase.from('solicitudes').update({ clave_ciec: newCIEC }).eq('id', requestId)
        if (error) throw error
      } catch (error) {
        console.error('Error al actualizar la clave CIEC:', error)
      }
    }

    setClaveCiec(newCIEC)
  }

  const handleClearClaveCiec = async () => {
    setClaveCiec(null)
    setTimeout(() => {
      if (inputCIECRef.current) {
        inputCIECRef.current.removeAttribute('readOnly')
        inputCIECRef.current?.focus()
      }
    }, 200)
  }

  const handleUploadDocument = async (files: File[]) => {
    if (!selectedDocumentId) return

    const selectedDoc = documents.find((doc) => doc.id === selectedDocumentId)
    if (!selectedDoc) return

    try {
      //Obtener todos los archivos rechazados del mismo tipo y borrarlos todos
      const rejectedFiles = allDocuments.filter((d) => d.tipo === selectedDoc.name && d.status === 'rechazado')
      for (const file of rejectedFiles) {
        await fetch(`${r2Api}/api/files/${file.url}`, {
          method: 'DELETE'
        })
      }

      //Borrar todos los archivos del mismo tipo con status rechazado de supabase
      const { error: insertError } = await supabase
        .from('documentos')
        .delete()
        .eq('status', 'rechazado')
        .eq('solicitud_id', requestId)
        .eq('tipo', selectedDoc.name)
      if (insertError) throw insertError

      // Para cada archivo seleccionado
      for (const file of files) {
        const uploadResult = await uploadToR2(file)

        if (!uploadResult.success) {
          throw new Error(uploadResult.error)
        }

        if (isMultipleUpload) {
          const { error: insertError } = await supabase.from('documentos').insert([
            {
              solicitud_id: requestId,
              nombre: file.name,
              tipo: selectedDoc.name,
              url: uploadResult.fileName,
              file_size: uploadResult.fileSize,
              original_name: file.name,
              status: 'pendiente'
            }
          ])
          if (insertError) throw insertError
        } else {
          const { error: insertError } = await supabase.from('documentos').insert([
            {
              solicitud_id: requestId,
              nombre: file.name,
              tipo: selectedDoc.name,
              url: uploadResult.fileName,
              file_size: uploadResult.fileSize,
              original_name: file.name,
              status: 'revision'
            }
          ])
          if (insertError) throw insertError
        }
      }

      onClose()
    } catch (error) {
      console.error('Error al subir el documento: ', error)
      throw error
    }
  }

  const handleSendToReview = async (document: Document) => {
    if (!document.dbDocument) return

    try {
      // Actualizar el estado del documento a 'revision' solo los que estén pendientes
      const { error } = await supabase
        .from('documentos')
        .update({ status: 'revision' })
        .eq('tipo', document.dbDocument.tipo)
        .eq('solicitud_id', requestId)
        .eq('status', 'pendiente')

      if (error) throw error
    } catch (error) {
      console.error('Error al enviar a revisión:', error)
    }
  }

  const handleViewDocument = async (document: Document) => {
    if (!document.dbDocument) return

    try {
      const response = await fetch(`${r2Api}/api/files/presigned-url/${document.dbDocument.url}`)
      const data = await response.json()

      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error al visualizar el documento:', error)
    }
  }

  const handleDeleteDocument = async (document: Document) => {
    try {
      // Eliminar archivo de R2
      await fetch(`${r2Api}/api/files/${document.dbDocument?.url}`, {
        method: 'DELETE'
      })

      const { error } = await supabase.from('documentos').delete().eq('id', document.dbDocument?.id)

      if (error) throw error
    } catch (error) {
      console.error('Error al eliminar el documento:', error)
    }
  }

  //TODO: Hacer funcion global con redux, slice notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

  const handleNotificationsPermision = () => {
    if (typeof Notification !== 'undefined') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          setNotificationsEnabled(true)
          alert('¡Notificaciones activadas!')
        } else {
          alert('Debes activar las notificaciones en la configuración del navegador.')
        }
      })
    } else {
      alert('Las notificaciones no son compatibles con este navegador.')
    }
  }

  const [isPrivate, setIsPrivate] = useState(false)
  const handleRequestPermissions = () => {
    //TODO: Modal para establecer permisos
    setIsPrivate(!isPrivate)
  }

  // Función para filtrar documentos basados en el criterio de búsqueda
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents]

    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.dbDocument?.original_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.category === categoryFilter)
    }

    return filtered
  }, [documents, searchQuery, categoryFilter])

  // Obtener las categorías disponibles en los documentos actuales
  const availableCategories = useMemo(() => {
    const categories = new Set<string>()

    documents.forEach((doc) => {
      categories.add(doc.category)
    })

    return Array.from(categories)
  }, [documents])

  // Agrupar documentos filtrados por categoría
  const documentsByCategory = useMemo(() => {
    return filteredDocuments.reduce((acc, doc) => {
      if (doc.dbDocument?.status === 'excluido') return acc // Filtra los excluidos

      if (!acc[doc.category]) {
        acc[doc.category] = []
      }
      acc[doc.category].push(doc)
      return acc
    }, {} as Record<string, Document[]>)
  }, [filteredDocuments])

  const handleOpenUploadModal = (docId: string) => {
    const selectedDoc = documents.find((doc) => doc.id === docId)
    setSelectedDocumentId(docId)
    setIsMultipleUpload(!!selectedDoc?.multipleFiles)
    onOpen()
  }

  // Calcular el progreso
  const requiredDocs = documents.filter((doc) => doc.required)
  const UploadedRequired = requiredDocs.filter((doc) => doc.dbDocument?.status === 'aceptado' || doc.dbDocument?.status === 'revision')

  const uploadedDocs = documents.filter((doc) => doc.dbDocument?.status === 'aceptado' || doc.dbDocument?.status === 'revision')
  const progress = Math.round((UploadedRequired.length / requiredDocs.length) * 100)

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Spinner color='primary' label='Cargando solicitud...' labelColor='primary' />
      </div>
    )
  }

  if (!request) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <img src={img404} alt='' />
        <h1 className='text-lg mt-6'>No se encontró la solicitud</h1>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 sm:p-8 sm:pb-0'>
      <PusherSetup requestId={request.id} />
      <Card className='max-w-5xl mx-auto'>
        <CardHeader className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 '>
          <div className='flex items-center gap-2 px-2 '>
            <img src={logo} alt='Logo' className='w-12 sm:w-14 ' />
            <div className='flex flex-col gap-0'>
              <p className='ml-1 text-xl sm:text-2xl font-bold blueFinancial font-montserrat'>Grupo Financial</p>
              <small className='ml-1 text-sm font-bold text-primary font-montserrat -mt-1'>Solicitud de crédito</small>
            </div>
          </div>
          <div className='flex items-center gap-2 px-2 '>
            <div className='hidden lg:flex flex-col items-end'>
              <h1 className='text-lg font-semibold'>{request.nombre}</h1>
              <p className='text-small text-default-500 -mt-1'>{request.rfc}</p>
            </div>
            <div className='flex gap-2 items-center'>
              <Button isIconOnly variant='flat' color={'primary'}>
                <MessageCircleQuestion size={30} />
              </Button>

              {/* TODO:Crear funcionalidad para estos botones */}
              {/* <Button isIconOnly variant='flat' color={isPrivate ? 'success' : 'warning'} onPress={handleRequestPermissions}>
                {isPrivate ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
              </Button>
              <Button isIconOnly variant='flat' color={'secondary'}>
                <Share2 size={28} />
              </Button> */}

              <Button
                isIconOnly
                variant='flat'
                color={notificationsEnabled ? 'success' : 'danger'}
                onPress={!notificationsEnabled ? handleNotificationsPermision : undefined}
              >
                {notificationsEnabled ? <BellRing size={28} /> : <BellOff size={28} />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className='p-0 '>
          <Tabs
            fullWidth={isMobile}
            color='primary'
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
            className='w-full flex px-4 '
            classNames={{
              panel: 'flex-1 bg-white dark:bg-gray-800 p-4 pt-0 flex flex-col justify-between gap-6 '
            }}
          >
            <Tab
              key='info'
              title={
                <div className='flex items-center gap-2 m-2'>
                  <FileText size={18} />
                  <span>Detalles</span>
                </div>
              }
            >
              <div className='grid grid-cols-2 gap-4 mt-4'>
                <div className='col-span-2 lg:hidden'>
                  <h1 className='text-lg font-semibold'>{request.nombre}</h1>
                  <p className='text-small text-default-500 -mt-1'>{request.rfc}</p>
                </div>
                <div className='col-span-2 sm:col-auto'>
                  <h4 className='font-medium text-default-500 pb-2'>Tipo de Cliente</h4>
                  <Chip variant='flat' color='primary'>
                    {request.tipo_cliente === 'personal' ? 'Personal' : 'Empresarial'}
                  </Chip>
                </div>
                <div className='col-span-2 sm:col-auto'>
                  <h4 className='font-medium text-default-500 pb-2'>Tipo de Crédito</h4>
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
                <div>
                  <h4 className='font-medium text-default-500 pb-2'>Monto solicitado</h4>
                  <p className='text-lg'>${request.monto.toLocaleString('es-MX')}</p>
                </div>
                <div>
                  <h4 className='font-medium text-default-500 pb-2'>Plazo</h4>
                  <p className='text-medium'>{request.plazo} meses</p>
                </div>
                <div>
                  <h4 className='font-medium text-default-500 pb-2'>Estado</h4>
                  {(() => {
                    const statusConfig = getRequestStatusConfig(request.status) // Obtiene la config del estado
                    const Icon = statusConfig.icon // Extrae el icono

                    return (
                      <Chip startContent={<Icon className='mx-1' size={20} />} variant='flat' color={statusConfig.color}>
                        {statusConfig.text}
                      </Chip>
                    )
                  })()}
                </div>
              </div>

              <div className='space-y-3'>
                <h3 className='font-medium text-default-500'>Datos adicionales</h3>
                <form className='flex flex-col sm:flex-row items-start gap-4 ' autoComplete='off' onSubmit={handleUpdateRequest}>
                  <Autocomplete
                    isRequired
                    id='destino'
                    name='destino'
                    className='max-w-[17rem]'
                    defaultItems={creditDestinations}
                    defaultSelectedKey={creditDestinations.find((item) => item.label === request.credit_destination)?.key}
                    isReadOnly={request.credit_destination ? true : false}
                    onSelectionChange={(item) => setDestinoCredito(item as string | null)}
                    label='Destino del crédito'
                    variant='bordered'
                    autoComplete='off'
                    errorMessage='Campo requerido'
                    isClearable
                    description={request.credit_destination ? false : '¿Para qué se utilizará el crédito?'}
                  >
                    {(item) => <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>}
                  </Autocomplete>

                  {claveCIEC ? (
                    <div className='flex  items-center text-success gap-1 h-14'>
                      <ShieldCheck size={30} />
                      <div>
                        <p>Clave CIEC almacenada</p>
                        <p className='text-tiny text-gray-600'>No se muestra por seguridad</p>
                      </div>
                    </div>
                  ) : (
                    <Input
                      name='ciec'
                      className='max-w-44'
                      endContent={
                        <button
                          aria-label='toggle password visibility'
                          className='focus:outline-none'
                          type='button'
                          onClick={toggleVisibility}
                        >
                          {isVisible ? <EyeOff /> : <Eye />}
                        </button>
                      }
                      label='Clave CIEC'
                      type={isVisible ? 'text' : 'password'}
                      variant='bordered'
                      isRequired
                      ref={inputCIECRef}
                      readOnly
                      //onValueChange={(value) => setClaveCiec(value)}
                      errorMessage='8 caracteres requeridos'
                      autoComplete='off'
                      minLength={8}
                      maxLength={8}
                      description={
                        <Popover placement='top'>
                          <span className='flex items-center gap-4'>
                            ¿Por qué se solicita?
                            <PopoverTrigger>
                              <CircleHelp />
                            </PopoverTrigger>
                          </span>
                          <PopoverContent>
                            <div className='px-1 py-2 max-w-[300px]'>
                              <div className='text-small font-semibold'>¿Para qué se usará?</div>
                              <div className='text-tiny'>
                                Para gestionar tu solicitud, necesitamos contar con tu clave CIEC, ya que nos permite acceder a tu
                                información fiscal de manera segura y verificar tu situación ante el SAT. Únicamente consultamos los datos
                                necesarios para agilizar el trámite de tu crédito.
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      }
                    />
                  )}

                  <Button
                    className='my-1'
                    size='lg'
                    variant='ghost'
                    color='primary'
                    onPress={claveCIEC ? handleClearClaveCiec : undefined}
                    type='submit'
                  >
                    {claveCIEC ? 'Cambiar' : 'Guardar'}
                  </Button>
                </form>
              </div>
            </Tab>
            <Tab
              key='documents'
              title={
                <div className='flex items-center gap-2 m-2'>
                  <Upload size={18} />
                  <span>Documentos</span>
                </div>
              }
              className='relative px-0'
            >
              <div ref={parentRef} className='w-full mx-auto relative'>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
                  className=' flex flex-col gap-4 fixed bottom-0 bg-white/80 dark:bg-gray-800 shadow-md z-30 w-max p-4 h-24 backdrop-blur-lg'
                  style={{
                    left: `calc(50% - ${parentWidth / 2}px)`, // Centrar el elemento
                    width: `${parentWidth}px` // Usar el ancho del padre
                  }}
                >
                  <Progress size='sm' value={progress} color='primary' showValueLabel label='Progreso general' className='max-w' />
                  <div className='flex justify-between gap-2'>
                    <span className='text-tiny text-default-500'>
                      {uploadedDocs.length} {uploadedDocs.length === 1 ? 'requisito enviado' : 'requisitos enviados'}
                    </span>
                    <span className='text-tiny text-default-500'>
                      {UploadedRequired.length} de {requiredDocs.length} requeridos
                    </span>
                  </div>
                </motion.div>
              </div>
              <div className=' space-y-6 relative  pb-28 px-4 min-h-[calc(100vh-12rem)]'>
                <div className='flex gap-4'>
                  <Input
                    className='flex-1'
                    placeholder='Buscar documentos...'
                    startContent={<Search size={18} />}
                    isClearable
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => setSearchQuery('')}
                  />
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant='flat' startContent={<Filter size={18} />} endContent={<ChevronDown size={18} />}>
                        {categoryFilter === 'all' ? 'Categoría' : categoryTitles[categoryFilter as keyof typeof categoryTitles]}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      selectedKeys={new Set([categoryFilter])} // <-- Asegura que selectedKeys sea un Set
                      onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as keyof typeof categoryTitles | 'all')}
                      selectionMode='single'
                      disallowEmptySelection
                    >
                      <>
                        <DropdownItem key='all'>Todas</DropdownItem>
                        <DropdownSection
                          items={availableCategories.map((category) => ({ key: category as keyof typeof categoryTitles }))}
                          aria-label='categorias'
                        >
                          {(category: { key: keyof typeof categoryTitles }) => (
                            <DropdownItem key={category.key}>{categoryTitles[category.key]}</DropdownItem>
                          )}
                        </DropdownSection>
                      </>
                    </DropdownMenu>
                  </Dropdown>
                </div>

                <div className='space-y-6'>
                  {Object.entries(documentsByCategory).map(([category, docs]) => (
                    <DocumentGroup
                      key={category}
                      title={categoryTitles[category as keyof typeof categoryTitles]}
                      documents={docs}
                      onUpload={handleOpenUploadModal}
                      onView={handleViewDocument}
                      onDelete={handleDeleteDocument}
                      onSendToReview={handleSendToReview}
                      allDocuments={allDocuments}
                    />
                  ))}
                  {Object.keys(documentsByCategory).length === 0 && (
                    <div className='text-center py-8 text-default-500'>No se encontraron documentos que coincidan con la búsqueda</div>
                  )}
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <UploadDocumentModal isOpen={isOpen} onClose={onClose} onUpload={handleUploadDocument} allowMultiple={isMultipleUpload} />
    </div>
  )
}
