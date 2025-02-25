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
  DropdownTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Spinner,
  Tab,
  Tabs,
  Tooltip,
  useDisclosure
} from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  FileWarning,
  FileX,
  Search,
  TriangleAlert,
  Upload,
  UploadCloud
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import logo from '../assets/branding/logo.svg'
import UploadDocumentModal from '../components/modals/UploadDocumentModal'
import { getRequiredDocuments } from '../constants/requiredDocuments'
import { useRealtime } from '../hooks/useRealTime'
import { uploadToR2 } from '../lib/cloudflare'
import { supabase } from '../lib/supabase'
import { Document } from '../schemas/documentSchemas'

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

//Hook IsMobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)') // Tailwind `sm`
    setIsMobile(mediaQuery.matches)

    const handler = () => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isMobile
}

const DocumentStatus = ({
  status,
  rejectCause,
  onReupload
}: {
  status: 'pendiente' | 'aceptado' | 'rechazado' | 'excluido'
  rejectCause?: 'incompleto' | 'incorrecto' | 'invalido' | 'ilegible' | 'alterado' | 'desactualizado'
  onReupload: () => void
}) => {
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

  const rejectedCauses = {
    incompleto: 'El documento está incompleto o falta información',
    incorrecto: 'El documento es incorrecto o contiene errores',
    invalido: 'El documento es inválido o no cumple con los requisitos',
    ilegible: 'El documento es ilegible o aparece borroso',
    alterado: 'El documento tiene signos de haber sido alterado o modificado',
    desactualizado: 'Es necesario cargar una versión más actualizada del documento'
  } as const

  const config = statusConfig[status]

  useEffect(() => {
    document.querySelectorAll('input').forEach((input) => {
      input.setAttribute('autocomplete', 'off')
    })
  }, [])

  return (
    <div className='flex items-center gap-3'>
      {status !== 'rechazado' ? (
        <Chip variant='flat' color={config.color}>
          {config.text}
        </Chip>
      ) : (
        <Popover placement='right'>
          <PopoverTrigger>
            <Chip variant='bordered' color={config.color} endContent={<CircleHelp size={18} />} className='cursor-pointer'>
              {config.text}
            </Chip>
          </PopoverTrigger>

          <PopoverContent>
            <div className='px-1 py-2'>
              <div className='text-small font-bold'>Motivo de rechazo</div>
              <div className='text-tiny'>{rejectCause ? rejectedCauses[rejectCause] : 'No especificado'}</div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

const DocumentGroup = ({
  title,
  documents,
  onUpload,
  onDownload,
  onView
}: {
  title: string
  documents: Document[]
  onUpload: (docId: string) => void
  onDownload: (doc: Document) => void
  onView: (doc: Document) => void
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
              <div className='flex flex-col'>
                <div className='flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4'>
                  <div className='flex items-center gap-2'>
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
                    <h3 className='text-medium font-semibold flex justify-between sm:justify-start items-center gap-2'>{doc.name}</h3>
                  </div>
                  {doc.required && (
                    <Chip
                      //className='self-end'
                      size='sm'
                      variant='light'
                      color='danger'
                      startContent={<TriangleAlert size={16} className='mr-1' />}
                    >
                      Requerido
                    </Chip>
                  )}
                </div>
                <div className='flex flex-col sm:flex-row items-start justify-between gap-4'>
                  <div>
                    <p className='text-small text-default-500 pt-4 sm:pt-1'>{doc.description}</p>
                    {doc.dbDocument && (
                      <div className='mt-2 space-y-2'>
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
                        <DocumentStatus
                          status={doc.dbDocument.status}
                          rejectCause={doc.dbDocument.reject_cause}
                          onReupload={() => onUpload(doc.id)}
                        />
                      </div>
                    )}
                  </div>
                  <div className='flex items-center self-end mt-4 sm:m-0 sm:self-auto gap-2'>
                    {doc.dbDocument && doc.dbDocument.status !== 'rechazado' && (
                      <>
                        <Tooltip content='Ver documento'>
                          <Button isIconOnly color='primary' variant='ghost' onPress={() => onView(doc)}>
                            <Eye />
                          </Button>
                        </Tooltip>
                        {/* <Button isIconOnly size='sm' variant='flat' onPress={() => onDownload(doc)}>
                          <Download size={18} />
                        </Button> */}
                      </>
                    )}
                    {(!doc.dbDocument || doc.dbDocument?.status === 'rechazado') && (
                      <Button color='primary' variant='ghost' onPress={() => onUpload(doc.id)}>
                        <UploadCloud /> {doc.dbDocument ? 'Cargar de nuevo' : 'Cargar'}
                      </Button>
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

export default function DocumentRepository() {
  const { requestId } = useParams()
  const [selectedTab, setSelectedTab] = useState('details')
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

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
  }, [requestId])

  useEffect(() => {
    if (request) {
      const requiredDocs = getRequiredDocuments(request.tipo_credito, request.tipo_cliente).map((doc) => ({ ...doc }))
      setDocuments(requiredDocs)
      fetchDocuments()
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

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedTab])

  const fetchDocuments = useCallback(async () => {
    try {
      const { data: dbDocuments, error } = await supabase.from('documentos').select('*').eq('solicitud_id', requestId)
      if (error) throw error

      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) => {
          const dbDoc = dbDocuments?.find((d) => d.tipo === doc.name)
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

  const handleUploadDocument = async (file: File) => {
    if (!selectedDocumentId) return

    const selectedDoc = documents.find((doc) => doc.id === selectedDocumentId)
    if (!selectedDoc) return

    try {
      const uploadResult = await uploadToR2(file)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      if (selectedDoc.dbDocument?.status === 'rechazado') {
        const { error: updateError } = await supabase
          .from('documentos')
          .update({
            nombre: file.name,
            url: uploadResult.fileName,
            file_size: uploadResult.fileSize,
            original_name: file.name,
            status: 'pendiente'
          })
          .eq('id', selectedDoc.dbDocument.id)

        if (updateError) throw updateError
      } else {
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
      }

      onClose()
    } catch (error) {
      console.error('Error al subir el documento:', error)
      throw error
    }
  }

  const handleDownloadDocument = async (document: Document) => {
    if (!document.dbDocument) return

    try {
      const response = await fetch(`${r2Api}/api/files/presigned-url/${document.dbDocument.url}`)
      const data = await response.json()

      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error al descargar el documento:', error)
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

  const categoryTitles = {
    identification: 'Identificación',
    financial: 'Financieros',
    property: 'Propiedad',
    business: 'Empresariales',
    guarantees: 'Garantías'
  }

  // Calcular el progreso
  const requiredDocs = documents.filter((doc) => doc.required)
  const uploadedDocs = requiredDocs.filter((doc) => doc.dbDocument?.status === 'aceptado' || doc.dbDocument?.status === 'pendiente')
  const totalUploadedDocs = documents.filter((doc) => doc.dbDocument)
  const progress = Math.round((uploadedDocs.length / requiredDocs.length) * 100)

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Spinner color='primary' label='Cargando solicitud...' labelColor='primary' />
      </div>
    )
  }

  if (!request) {
    return <div>Solicitud no encontrada</div>
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 sm:p-8 sm:pb-0'>
      <Card className='max-w-5xl mx-auto'>
        <CardHeader className='flex flex-row justify-between items-center gap-4 '>
          <div className='flex items-center gap-2 px-2'>
            <img src={logo} alt='Logo' className='w-12 sm:w-14 ' />
            <div className='flex flex-col gap-0'>
              <p className='ml-1 text-xl sm:text-2xl font-bold blueFinancial font-montserrat'>Grupo Financial</p>
              <small className='ml-1 text-sm font-bold text-primary font-montserrat -mt-1'>Solicitud de crédito</small>
            </div>
          </div>
          <div className='flex items-center gap-2 px-2 '>
            <div className='hidden sm:flex flex-col items-end'>
              <h1 className='text-lg font-semibold'>{request.nombre}</h1>
              <p className='text-small text-default-500 -mt-1'>{request.rfc}</p>
            </div>
            <div>
              <CircleHelp size={32} />
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
                <div className='col-span-2 sm:hidden'>
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
                  <h4 className='font-medium text-default-500 pb-2'>Monto</h4>
                  <p className='text-medium'>${request.monto.toLocaleString('es-MX')}</p>
                </div>
                <div>
                  <h4 className='font-medium text-default-500 pb-2'>Plazo</h4>
                  <p className='text-medium'>{request.plazo} meses</p>
                </div>
                <div>
                  <h4 className='font-medium text-default-500 pb-2'>Estado</h4>
                  <Chip variant='flat' color='primary'>
                    {request.status}
                  </Chip>
                </div>
              </div>

              <div className='space-y-3'>
                <h3 className='font-medium text-default-500'>Datos adicionales</h3>
                <form className='flex flex-col items-start gap-2' autoComplete='off'>
                  <Autocomplete
                    isRequired
                    id='destino'
                    name='destino'
                    className='max-w-xs'
                    defaultItems={creditDestinations}
                    defaultSelectedKey='cat'
                    label='Destino del crédito'
                    variant='bordered'
                    autoComplete='off'
                    isClearable
                    description='¿Para qué se utilizará el crédito?'
                  >
                    {(item) => <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>}
                  </Autocomplete>
                  <Input
                    name='ciec'
                    className='max-w-xs '
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
                    autoComplete='destination'
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
                              Para gestionar tu solicitud, necesitamos contar con tu clave CIEC, ya que nos permite acceder a tu información
                              fiscal de manera segura y verificar tu situación ante el SAT. Únicamente consultamos los datos necesarios para
                              agilizar el trámite de tu crédito.
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    }
                  />
                  <Button className='my-1'>Guardar</Button>
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
                    <span className='text-tiny text-default-500'>{totalUploadedDocs.length} documentos subidos</span>
                    <span className='text-tiny text-default-500'>
                      {uploadedDocs.length} de {requiredDocs.length} requeridos
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
                      <Button variant='flat'>
                        Categoría
                        <ChevronDown size={18} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      selectedKeys={[categoryFilter]}
                      onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as string)}
                    >
                      <DropdownItem key='all'>Todas</DropdownItem>
                      <DropdownItem key='identification'>Identificación</DropdownItem>
                      <DropdownItem key='financial'>Financieros</DropdownItem>
                      <DropdownItem key='property'>Propiedad</DropdownItem>
                      <DropdownItem key='business'>Empresariales</DropdownItem>
                      <DropdownItem key='guarantees'>Garantías</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>

                <div className='space-y-6'>
                  {Object.entries(documentsByCategory).map(([category, docs]) => (
                    <DocumentGroup
                      key={category}
                      title={categoryTitles[category as keyof typeof categoryTitles]}
                      documents={docs}
                      onUpload={(docId) => {
                        setSelectedDocumentId(docId)
                        onOpen()
                      }}
                      onDownload={handleDownloadDocument}
                      onView={handleViewDocument}
                    />
                  ))}
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <UploadDocumentModal isOpen={isOpen} onClose={onClose} onUpload={handleUploadDocument} />
    </div>
  )
}
