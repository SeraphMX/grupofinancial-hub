import { Chip, Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react'
import { AlertTriangle, CheckCircle2, CircleHelp, FileX } from 'lucide-react'
import { useEffect } from 'react'

const DocumentStatus = ({
  status,
  rejectCause
}: {
  status: 'pendiente' | 'revision' | 'aceptado' | 'rechazado' | 'excluido'
  rejectCause?: 'incompleto' | 'incorrecto' | 'invalido' | 'ilegible' | 'alterado' | 'desactualizado'
}) => {
  const statusConfig = {
    pendiente: {
      color: 'warning',
      icon: AlertTriangle,
      text: 'pendiente'
    },
    revision: {
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

export default DocumentStatus
