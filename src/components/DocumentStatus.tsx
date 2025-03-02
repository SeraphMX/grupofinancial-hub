import { Chip, Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react'
import { AlertTriangle, CheckCircle2, CircleHelp, FileX, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useIsMobile } from '../hooks/useIsMobile'

const DocumentStatus = ({
  status,
  rejectCause,
  onReject
}: {
  status: 'pendiente' | 'revision' | 'aceptado' | 'rechazado' | 'excluido'
  rejectCause?: 'incompleto' | 'incorrecto' | 'invalido' | 'ilegible' | 'alterado' | 'desactualizado'
  onReject?: () => void
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const isMobile = useIsMobile()

  const statusConfig = {
    pendiente: { color: 'warning', icon: AlertTriangle, text: 'Pendiente' },
    revision: { color: 'warning', icon: AlertTriangle, text: 'En revisión' },
    aceptado: { color: 'success', icon: CheckCircle2, text: 'Aceptado' },
    rechazado: { color: 'danger', icon: FileX, text: 'Rechazado' },
    excluido: { color: 'primary', icon: FileX, text: 'Excluido' }
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
  const isAdmin = Boolean(useSelector((state: any) => state.auth?.user?.role) === 'admin')

  useEffect(() => {
    document.querySelectorAll('input').forEach((input) => {
      input.setAttribute('autocomplete', 'off')
    })
  }, [])

  const handleRejectClick = () => {
    if (onReject) {
      onReject()
    }
    setIsPopoverOpen(false) // Cierra el Popover al abrir el modal
  }

  return (
    <div className='flex items-center gap-3 flex-grow'>
      {status !== 'rechazado' ? (
        <Chip variant='flat' color={config.color}>
          {config.text}
        </Chip>
      ) : (
        <Popover
          placement={isMobile ? 'bottom' : 'left'}
          className='max-w-[320px]'
          isOpen={isPopoverOpen}
          onOpenChange={setIsPopoverOpen} // Controla el estado del Popover
        >
          <PopoverTrigger>
            <Chip
              variant='bordered'
              color={config.color}
              endContent={<CircleHelp size={18} />}
              className='cursor-pointer'
              onClick={() => setIsPopoverOpen(true)} // Abre el Popover manualmente
            >
              {config.text}
            </Chip>
          </PopoverTrigger>

          <PopoverContent>
            <div className='px-1 py-2'>
              <div className='text-small font-bold flex justify-between items-center pb-1'>
                Motivo de rechazo {isAdmin && <SquarePen size={20} onClick={handleRejectClick} className='cursor-pointer' />}
              </div>
              <div className='text-small'>{rejectCause ? rejectedCauses[rejectCause] : 'No especificado'}</div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default DocumentStatus
