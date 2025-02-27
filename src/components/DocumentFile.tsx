import { Button } from '@nextui-org/react'
import { Check, Eye, FileText, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import DocumentStatus from '../pages/DocumentStatus'

// Componente para mostrar un archivo individual
const DocumentFile = ({
  file,
  onView,
  onDelete,
  onAccept,
  onReject
}: {
  file: any
  onView: () => void
  onDelete?: () => void
  onAccept?: () => void
  onReject?: () => void
}) => {
  const isAdmin = Boolean(useSelector((state: any) => state.auth?.user?.role) === 'admin')

  return (
    <div className='flex justify-between items-center p-2 bg-default-100 rounded-lg my-1'>
      <div className='flex items-center gap-2 overflow-hidden'>
        <FileText size={16} className='flex-shrink-0 text-primary' />
        <span className='text-small truncate'>{file.original_name}</span>
        {file.file_size && (
          <span className='text-tiny text-default-500 flex-shrink-0'>({(file.file_size / 1024 / 1024).toFixed(2)} MB)</span>
        )}
      </div>
      <div className='flex items-center gap-1'>
        <DocumentStatus status={file.status} rejectCause={file.reject_cause} />
        {file.status !== 'rechazado' && (
          <Button isIconOnly size='sm' color='primary' variant='light' onPress={onView}>
            <Eye size={16} />
          </Button>
        )}

        {file.status === 'pendiente' && (
          <Button isIconOnly size='sm' color='danger' variant='light' onPress={onDelete}>
            <X size={16} />
          </Button>
        )}

        {/*TODO:Verificar sin necesitamos este boton , y por que al eliminar de la base no recarga */}
        {file.status === 'rechazado' && (
          <Button isIconOnly size='sm' color='danger' variant='light' onPress={onDelete}>
            <X size={16} />
          </Button>
        )}

        {isAdmin && file.status === 'revision' && (
          <>
            <Button isIconOnly size='sm' color='success' variant='light' onPress={onAccept}>
              <Check size={16} />
            </Button>
            <Button isIconOnly size='sm' color='danger' variant='light' onPress={onReject}>
              <X size={16} />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default DocumentFile
