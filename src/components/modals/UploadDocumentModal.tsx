import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react'
import { AlertCircle, FileText, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

export default function UploadDocumentModal({ isOpen, onClose, onUpload }: UploadDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5242880, // 5MB
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0])
        setError(null)
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0]?.message || 'Error al subir el archivo'
      setError(error)
    }
  })

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor seleccione un archivo')
      return
    }

    try {
      setUploading(true)
      setError(null)
      await onUpload(selectedFile)
      onClose()
    } catch (error) {
      setError('Error al subir el documento. Por favor intente nuevamente.')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
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
            <ModalHeader>Subir Documento</ModalHeader>
            <ModalBody>
              <div className='space-y-6'>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}
                    ${selectedFile ? 'bg-success/10 border-success' : ''}`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className='flex flex-col items-center gap-2'>
                      <FileText className='w-12 h-12 text-success' />
                      <div>
                        <p className='font-medium'>{selectedFile.name}</p>
                        <p className='text-small text-default-500'>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button size='sm' color='danger' variant='light' startContent={<X size={16} />} onPress={() => setSelectedFile(null)}>
                        Remover archivo
                      </Button>
                    </div>
                  ) : (
                    <div className='flex flex-col items-center gap-2'>
                      <Upload className='w-12 h-12 text-default-400' />
                      <div>
                        <p className='font-medium'>
                          {isDragActive ? 'Suelte el archivo aquí' : 'Arrastre y suelte el archivo aquí o haga clic para seleccionar'}
                        </p>
                        <p className='text-small text-default-500'>PDF, JPG o PNG (máx. 5MB)</p>
                      </div>
                    </div>
                  )}
                </div>

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
              <Button color='primary' onPress={handleUpload} isLoading={uploading} isDisabled={!selectedFile}>
                Subir Documento
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
