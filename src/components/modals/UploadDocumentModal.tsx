import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react'
import { AlertCircle, FileText, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[]) => Promise<void>
  allowMultiple?: boolean
}

export default function UploadDocumentModal({ isOpen, onClose, onUpload, allowMultiple = false }: UploadDocumentModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5242880, // 5MB
    maxFiles: allowMultiple ? 10 : 1,
    multiple: allowMultiple,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        if (allowMultiple) {
          setSelectedFiles((prev) => [...prev, ...acceptedFiles])
        } else {
          setSelectedFiles([acceptedFiles[0]])
        }
        setError(null)
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0]?.message || 'Error al subir el archivo'
      setError(error)
    }
  })

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Por favor seleccione al menos un archivo')
      return
    }

    try {
      setUploading(true)
      setError(null)
      await onUpload(selectedFiles)
      onClose()

      resetForm()
    } catch (error) {
      setError('Error al subir el documento. Por favor intente nuevamente.')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setSelectedFiles([])
    setError(null)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm()
        onClose()
      }}
      size='2xl'
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{allowMultiple ? 'Subir Documentos' : 'Subir Documento'}</ModalHeader>
            <ModalBody>
              <div className='space-y-6'>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}
                    ${selectedFiles.length > 0 ? 'bg-success/10 border-success' : ''}`}
                >
                  <input {...getInputProps()} />
                  {selectedFiles.length > 0 ? (
                    <div className='flex flex-col items-center gap-2'>
                      <FileText className='w-12 h-12 text-success' />
                      <div>
                        <p className='font-medium'>
                          {allowMultiple ? `${selectedFiles.length} archivos seleccionados` : selectedFiles[0].name}
                        </p>
                        <p className='text-small text-default-500'>
                          {allowMultiple
                            ? `Tamaño total: ${(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB`
                            : `${(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                      {!allowMultiple && (
                        <Button
                          size='sm'
                          color='danger'
                          variant='light'
                          startContent={<X size={16} />}
                          onPress={() => setSelectedFiles([])}
                        >
                          Remover archivo
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className='flex flex-col items-center gap-2'>
                      <Upload className='w-12 h-12 text-default-400' />
                      <div>
                        <p className='font-medium'>
                          {isDragActive ? 'Suelte el archivo aquí' : 'Arrastre y suelte el archivo aquí o haga clic para seleccionar'}
                        </p>
                        <p className='text-small text-default-500'>PDF, JPG o PNG (máx. 5MB {allowMultiple && ', hasta 10 archivos'})</p>
                      </div>
                    </div>
                  )}
                </div>

                {allowMultiple && selectedFiles.length > 0 && (
                  <div className='space-y-2'>
                    <p className='font-medium'>Archivos seleccionados:</p>
                    <div className='max-h-60 overflow-y-auto space-y-2 p-2 border rounded-lg'>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className='flex justify-between items-center p-2 bg-default-100 rounded-lg'>
                          <div className='flex items-center gap-2 overflow-hidden'>
                            <FileText size={16} className='flex-shrink-0' />
                            <span className='text-small truncate'>{file.name}</span>
                            <span className='text-tiny text-default-500 flex-shrink-0'>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <Button isIconOnly size='sm' color='danger' variant='light' onPress={() => removeFile(index)}>
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      size='sm'
                      color='primary'
                      variant='light'
                      startContent={<Upload size={16} />}
                      onPress={(event) => getRootProps().onClick?.(event as unknown as React.MouseEvent<HTMLElement>)}
                    >
                      Agregar más archivos
                    </Button>
                  </div>
                )}

                {error && (
                  <div className='flex items-center gap-2 text-danger'>
                    <AlertCircle size={16} />
                    <p className='text-small'>{error}</p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant='light'
                onPress={() => {
                  resetForm()
                  onClose()
                }}
              >
                Cancelar
              </Button>
              <Button color='primary' onPress={handleUpload} isLoading={uploading} isDisabled={selectedFiles.length === 0}>
                Subir {allowMultiple && selectedFiles.length > 1 ? 'Documentos' : 'Documento'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
