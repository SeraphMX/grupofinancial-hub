import { Button, Card, Chip, Tooltip } from '@nextui-org/react'
import { ChevronDown, ChevronRight, CloudUpload, FileCheck, FileMinus2, FilePlus2, FileText, FileWarning, FileX } from 'lucide-react'
import { useState } from 'react'
import { Document } from '../schemas/documentSchemas'
import DocumentFile from './DocumentFile'

const DocumentGroup = ({
  title,
  documents,
  onView,
  onAccept,
  onReject,
  onExclude,
  onInclude,
  allDocuments
}: {
  title: string
  documents: Document[]
  onView: (doc: Document) => void
  onAccept: (doc: Document) => void
  onReject: (doc: Document) => void
  onExclude: (doc: Document) => void
  onInclude: (doc: Document) => void
  allDocuments: any[]
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  // Función para verificar si un documento tiene múltiples archivos cargados
  const hasMultipleFiles = (doc: Document) => {
    return doc.multipleFiles && doc.dbDocument?.status === 'pendiente'
  }

  // Función para obtener todos los documentos de un tipo específico
  const getDocumentFiles = (doc: Document) => {
    if (!doc.multipleFiles) return []

    //Trae los documentos del mismo tipo que el documento actual y que no estén pendientes
    return allDocuments.filter((d) => d.tipo === doc.name).filter((d) => d.status !== 'pendiente')
    //.sort((a, b) => (a.status || '').localeCompare(b.status || ''))
  }

  // Verificar si un documento tiene múltiples archivos subidos
  const hasMultipleUploads = (doc: Document) => {
    const files = getDocumentFiles(doc)
    return doc.multipleFiles && files.length > 0
  }

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
                <div className='flex sm:items-center gap-2 sm:gap-4 w-full'>
                  {doc.dbDocument?.status === 'aceptado' ? (
                    <FileCheck className='text-success' size={24} />
                  ) : doc.dbDocument?.status === 'rechazado' ? (
                    <FileX className='text-danger' size={24} />
                  ) : doc.dbDocument?.status === 'revision' ? (
                    <FileWarning className='text-warning' size={24} />
                  ) : (
                    // Caso por defecto: pendiente
                    <FileText className='text-primary' size={24} />
                  )}
                  <div className='flex-grow'>
                    <h3 className='text-medium font-semibold flex justify-between sm:justify-start items-center gap-2'>
                      {doc.name}
                      {doc.required && (
                        <Chip size='sm' variant='flat' color='danger'>
                          Requerido
                        </Chip>
                      )}
                    </h3>
                    <p className='text-small text-default-500 pt-4 sm:pt-1'>{doc.description}</p>

                    {/* Mostrar un solo documento si no es multipleFiles */}
                    {doc.dbDocument &&
                      !doc.multipleFiles &&
                      (doc.dbDocument.status === 'excluido' ? (
                        <Chip variant='flat' color='primary'>
                          Documento excluido
                        </Chip>
                      ) : (
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
                              onAccept={() => {
                                const docWithFile = { ...doc, dbDocument: doc.dbDocument }
                                onAccept(docWithFile)
                              }}
                              onReject={() => {
                                const docWithFile = { ...doc, dbDocument: doc.dbDocument }
                                onReject(docWithFile)
                              }}
                            />
                          </div>
                        </div>
                      ))}

                    {/* Mostrar múltiples documentos si es multipleFiles */}
                    {doc.multipleFiles && (
                      <div className='mt-2'>
                        {hasMultipleUploads(doc) &&
                          (doc.dbDocument?.status === 'excluido' ? (
                            <Chip variant='flat' color='primary'>
                              Documento excluido
                            </Chip>
                          ) : (
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
                                    onAccept={() => {
                                      const docWithFile = { ...doc, dbDocument: file }
                                      onAccept(docWithFile)
                                    }}
                                    onReject={() => {
                                      const docWithFile = { ...doc, dbDocument: file }
                                      onReject(docWithFile)
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex items-center self-end mt-4 sm:m-0 sm:self-auto gap-2'>
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
