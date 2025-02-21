import { Button, Card, CardBody, CardHeader, Chip, Progress, Tab, Tabs, useDisclosure } from '@nextui-org/react'
import { AlertTriangle, CheckCircle2, FileCheck, FileText, FileX, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import UploadDocumentModal from '../components/modals/UploadDocumentModal'
import { getRequiredDocuments, type RequiredDocument } from '../constants/requiredDocuments'
import { uploadToR2 } from '../lib/cloudflare'
import { supabase } from '../lib/supabase'

interface Document extends RequiredDocument {
  dbDocument?: {
    id: string
    nombre: string
    url: string
    created_at: string
    status: 'pendiente' | 'aceptado' | 'rechazado'
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
      <Chip startContent={<config.icon size={16} />} variant='flat' color={config.color}>
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

export default function DocumentRepository() {
  const { requestId } = useParams()
  const [selectedTab, setSelectedTab] = useState('info')
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)

  useEffect(() => {
    console.log(requestId)
    fetchRequest()
  }, [requestId])

  useEffect(() => {
    if (request) {
      // Obtener documentos requeridos según el tipo de crédito y cliente
      const requiredDocs = getRequiredDocuments(request.tipo_credito, request.tipo_cliente).map((doc) => ({ ...doc }))
      setDocuments(requiredDocs)
      fetchDocuments()
    }
  }, [request])

  const fetchRequest = async () => {
    console.log('first')

    try {
      console.log('Vamos a buscar la solicitud')
      const { data, error } = await supabase.from('solicitudes').select('*').eq('id', requestId).single()

      console.log(data)

      if (error) throw error
      console.log('error')
      setRequest(data)
    } catch (error) {
      console.log('error')
      console.error('Error al obtener la solicitud:', error)
    } finally {
      console.log('first')
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data: dbDocuments, error } = await supabase.from('documentos').select('*').eq('solicitud_id', requestId)

      if (error) throw error

      setDocuments(
        documents.map((doc) => {
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
  }

  const handleUploadDocument = async (file: File) => {
    if (!selectedDocumentId) return

    const selectedDoc = documents.find((doc) => doc.id === selectedDocumentId)
    if (!selectedDoc) return

    try {
      const uploadResult = await uploadToR2(file)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      const { data: newDocument, error } = await supabase
        .from('documentos')
        .insert([
          {
            solicitud_id: requestId,
            nombre: file.name,
            tipo: selectedDoc.name,
            url: uploadResult.fileName,
            status: 'pendiente'
          }
        ])
        .select()
        .single()

      if (error) throw error

      setDocuments(
        documents.map((doc) =>
          doc.id === selectedDocumentId
            ? {
                ...doc,
                dbDocument: newDocument
              }
            : doc
        )
      )

      onClose()
    } catch (error) {
      console.error('Error al subir el documento:', error)
      throw error
    }
  }

  const handleReupload = (documentId: string) => {
    setSelectedDocumentId(documentId)
    onOpen()
  }

  // Calcular el progreso considerando solo documentos requeridos y aceptados
  const requiredDocs = documents.filter((doc) => doc.required)
  const uploadedDocs = requiredDocs.filter((doc) => doc.dbDocument?.status === 'aceptado' || doc.dbDocument?.status === 'pendiente')
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
          <h1 className='text-2xl font-bold'>Repositorio de Documentos</h1>
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
                <div className='flex items-center gap-4'>
                  <Progress size='md' value={progress} color='primary' showValueLabel className='max-w-md' />
                  <span className='text-small text-default-500'>
                    {uploadedDocs.length} de {requiredDocs.length} documentos requeridos aceptados
                  </span>
                </div>

                <div className='space-y-4'>
                  {documents.map((doc) => (
                    <Card key={doc.id} className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          {doc.dbDocument?.status === 'aceptado' ? (
                            <FileCheck className='text-success' size={24} />
                          ) : (
                            <FileX className='text-danger' size={24} />
                          )}
                          <div>
                            <h3 className='text-medium font-semibold'>
                              {doc.name}
                              {doc.required && (
                                <Chip size='sm' variant='flat' color='danger' className='ml-2'>
                                  Requerido
                                </Chip>
                              )}
                            </h3>
                            <p className='text-small text-default-500'>{doc.description}</p>
                            {doc.dbDocument && (
                              <div className='mt-2 space-y-2'>
                                <p className='text-tiny text-default-400'>Archivo: {doc.dbDocument.nombre}</p>
                                <DocumentStatus status={doc.dbDocument.status} onReupload={() => handleReupload(doc.id)} />
                              </div>
                            )}
                          </div>
                        </div>
                        {(!doc.dbDocument || doc.dbDocument?.status === 'rechazado') && (
                          <Button
                            color='primary'
                            onPress={() => {
                              setSelectedDocumentId(doc.id)
                              onOpen()
                            }}
                          >
                            {doc.dbDocument ? 'Subir de nuevo' : 'Subir'}
                          </Button>
                        )}
                      </div>
                    </Card>
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
