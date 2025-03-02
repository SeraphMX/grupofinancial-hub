import { Button, Tooltip } from '@nextui-org/react'
import { CheckCircle, CircleOff, FileSearch, FileText, Trash } from 'lucide-react'
import { useSelector } from 'react-redux'
import DocumentStatus from './DocumentStatus'

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
    <div className='flex flex-col sm:flex-row gap-2 justify-between sm:items-center p-2 bg-default-100 rounded-lg my-1'>
      <div className='flex items-center gap-2 overflow-hidden justify-between sm:justify-start'>
        <FileText size={16} className='flex-shrink-0 text-primary' />
        <span className='text-small truncate flex-grow'>{file.original_name}</span>
        {file.file_size && <span className='text-tiny text-default-500 flex-none'>({(file.file_size / 1024 / 1024).toFixed(2)} MB)</span>}
      </div>
      <div className='items-center gap-1 flex flex-wrap sm:flex-nowrap justify-between'>
        <DocumentStatus status={file.status} rejectCause={file.reject_cause} onReject={onReject} />

        {file.status === 'rechazado' ||
          (file.status === 'pendiente' && (
            <Tooltip content='Eliminar archivo' placement='top'>
              <Button isIconOnly size='sm' color='danger' variant='light' onPress={onDelete}>
                <Trash />
              </Button>
            </Tooltip>
          ))}

        {isAdmin && file.status === 'revision' && (
          <>
            <Tooltip content='Rechazar' placement='top'>
              <Button isIconOnly size='sm' color='danger' variant='light' onPress={onReject}>
                <CircleOff />
              </Button>
            </Tooltip>
            <Tooltip content='Aceptar' placement='top'>
              <Button isIconOnly size='sm' color='success' variant='light' onPress={onAccept}>
                <CheckCircle />
              </Button>
            </Tooltip>
          </>
        )}

        <Tooltip content='Ver archivo' placement='top'>
          <Button isIconOnly size='sm' color='primary' variant='light' onPress={onView}>
            <FileSearch />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

export default DocumentFile
