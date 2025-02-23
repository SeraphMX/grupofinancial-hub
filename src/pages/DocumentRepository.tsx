import {
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
  Progress,
  Tab,
  Tabs,
  useDisclosure
} from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  File,
  FileCheck,
  FileText,
  FileWarning,
  FileX,
  Search,
  Upload
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import UploadDocumentModal from '../components/modals/UploadDocumentModal'
import { getRequiredDocuments, type RequiredDocument } from '../constants/requiredDocuments'
import { useRealtime } from '../hooks/useRealTime'
import { uploadToR2 } from '../lib/cloudflare'
import { supabase } from '../lib/supabase'

interface Document extends RequiredDocument {
  dbDocument?: {
    id: string
    nombre: string
    url: string
    created_at: string
    status: 'pendiente' | 'aceptado' | 'rechazado'
    size?: number
  }
}

const DocumentStatus = ({ status, onReupload }: { status: 'pendiente' | 'aceptado' | 'rechazado'; onReupload: () => void }) => {
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
    }
  } as const

  const config = statusConfig[status]

  return (
    <div className='flex items-center gap-3'>
      <Chip variant='flat' color={config.color}>
        {config.text}
      </Chip>
      {status === 'rechazado' && (
        <Button size='sm' color='primary' variant='flat' onPress={onReupload}>
          Subir de nuevo
        </Button>
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
                    <File className='text-primary' size={24} />
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
                        <div className='flex items-center gap-4 text-tiny text-default-400'>
                          <span>Archivo: {doc.dbDocument.nombre}</span>
                          <span>•</span>
                          <span>{format(new Date(doc.dbDocument.created_at), 'd MMM yyyy, HH:mm', { locale: es })}</span>
                          {doc.dbDocument.size && (
                            <>
                              <span>•</span>
                              <span>{(doc.dbDocument.size / 1024 / 1024).toFixed(2)} MB</span>
                            </>
                          )}
                        </div>
                        <DocumentStatus status={doc.dbDocument.status} onReupload={() => onUpload(doc.id)} />
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex items-center self-end mt-4 sm:m-0 sm:self-auto gap-2'>
                  {doc.dbDocument && (
                    <>
                      <Button isIconOnly size='sm' variant='flat' onPress={() => onView(doc)}>
                        <Eye size={18} />
                      </Button>
                      {/* <Button isIconOnly size='sm' variant='flat' onPress={() => onDownload(doc)}>
                        <Download size={18} />
                      </Button> */}
                    </>
                  )}
                  {(!doc.dbDocument || doc.dbDocument?.status === 'rechazado') && (
                    <Button color='primary' onPress={() => onUpload(doc.id)}>
                      {doc.dbDocument ? 'Cargar de nuevo' : 'Cargar'}
                    </Button>
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

export default function DocumentRepository() {
  const { requestId } = useParams()
  const [selectedTab, setSelectedTab] = useState('documents')
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const r2Api = import.meta.env.VITE_R2SERVICE_URL // Cloudflare Worker API

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
          doc.dbDocument?.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.category === categoryFilter)
    }

    return filtered
  }, [documents, searchQuery, categoryFilter])

  const documentsByCategory = useMemo(() => {
    return filteredDocuments.reduce((acc, doc) => {
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
    return <div>Cargando...</div>
  }

  if (!request) {
    return <div>Solicitud no encontrada</div>
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 p-8'>
      <Card className='max-w-5xl mx-auto'>
        <CardHeader className='flex flex-col gap-2'>
          <h1 className='text-2xl font-bold'>Documentación requerida</h1>
          <p className='text-default-500'>
            Solicitud #{requestId} - {request.nombre}
          </p>
        </CardHeader>
        <CardBody>
          <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key.toString())}>
            <Tab
              key='info'
              title={
                <div className='flex items-center gap-2'>
                  <FileText size={18} />
                  <span>Información</span>
                </div>
              }
            >
              <div className='py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <h3 className='text-small font-medium text-default-500'>Tipo de Crédito</h3>
                    <p className='text-medium'>{request.tipo_credito}</p>
                  </div>
                  <div>
                    <h3 className='text-small font-medium text-default-500'>Monto</h3>
                    <p className='text-medium'>${request.monto.toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <h3 className='text-small font-medium text-default-500'>Plazo</h3>
                    <p className='text-medium'>{request.plazo} meses</p>
                  </div>
                  <div>
                    <h3 className='text-small font-medium text-default-500'>Estado</h3>
                    <Chip variant='flat' color='primary'>
                      {request.status}
                    </Chip>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab
              key='documents'
              title={
                <div className='flex items-center gap-2'>
                  <Upload size={18} />
                  <span>Documentos</span>
                </div>
              }
            >
              <div className='py-4 space-y-6'>
                <div className='flex flex-col gap-4'>
                  <Progress size='md' value={progress} color='primary' showValueLabel label='Progreso general' className='max-w' />
                  <div className='flex justify-between gap-2'>
                    <span className='text-small text-default-500'>
                      {uploadedDocs.length} de {requiredDocs.length} documentos requeridos
                    </span>
                    <span className='text-small text-default-500'>
                      {totalUploadedDocs.length} de {documents.length} documentos subidos
                    </span>
                  </div>
                </div>

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
