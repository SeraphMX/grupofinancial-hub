import { Button, Chip, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tab, Tabs } from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, FileText } from 'lucide-react'

interface ViewRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: any
  onEdit: (request: any) => void
  onGenerateRepository: (request: any) => void
}

export default function ViewRequestModal({ isOpen, onClose, request, onEdit, onGenerateRepository }: ViewRequestModalProps) {
  if (!request) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='3xl' scrollBehavior='inside'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <div className='flex flex-col gap-1'>
                <h3 className='text-lg font-semibold'>Solicitud #{request.id}</h3>
                <p className='text-small text-default-500'>
                  Creada el {format(new Date(request.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </ModalHeader>
            <ModalBody>
              <Tabs aria-label='Detalles de la solicitud' disableAnimation>
                <Tab
                  key='details'
                  title={
                    <div className='flex items-center gap-2'>
                      <FileText size={18} />
                      <span>Detalles</span>
                    </div>
                  }
                >
                  <div className='grid grid-cols-2 gap-4 py-4'>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Solicitante</h4>
                      <p className='text-medium'>{request.nombre}</p>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Email</h4>
                      <p className='text-medium'>{request.email}</p>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Teléfono</h4>
                      <p className='text-medium'>{request.telefono}</p>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>RFC</h4>
                      <p className='text-medium'>{request.rfc}</p>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Tipo de Cliente</h4>
                      <Chip variant='flat' color='primary'>
                        {request.tipo_cliente === 'personal' ? 'Personal' : 'Empresarial'}
                      </Chip>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Tipo de Crédito</h4>
                      <Chip variant='flat' color='secondary'>
                        {request.tipo_credito.charAt(0).toUpperCase() + request.tipo_credito.slice(1)}
                      </Chip>
                    </div>
                    {request.tipo_cliente === 'empresarial' && (
                      <>
                        <div>
                          <h4 className='text-small font-medium text-default-500'>Empresa</h4>
                          <p className='text-medium'>{request.nombre_empresa}</p>
                        </div>
                        <div>
                          <h4 className='text-small font-medium text-default-500'>Industria</h4>
                          <p className='text-medium'>{request.industria}</p>
                        </div>
                        <div>
                          <h4 className='text-small font-medium text-default-500'>Ingresos Anuales</h4>
                          <p className='text-medium'>${request.ingresos_anuales?.toLocaleString('es-ES')}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Monto Solicitado</h4>
                      <p className='text-medium'>${request.monto.toLocaleString('es-ES')}</p>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Plazo</h4>
                      <p className='text-medium'>{request.plazo} meses</p>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Pago Mensual</h4>
                      <p className='text-medium'>${request.pago_mensual.toLocaleString('es-ES')}</p>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Tipo de Garantía</h4>
                      <Chip variant='flat' color='warning'>
                        {request.tipo_garantia?.replace('_', ' ').charAt(0).toUpperCase() +
                          request.tipo_garantia?.replace('_', ' ').slice(1) || 'Sin garantía'}
                      </Chip>
                    </div>
                    <div>
                      <h4 className='text-small font-medium text-default-500'>Estado</h4>
                      <Chip variant='flat' color={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Chip>
                    </div>
                  </div>
                </Tab>
                <Tab
                  key='documents'
                  title={
                    <div className='flex items-center gap-2'>
                      <FileText size={18} />
                      <span>Documentos</span>
                    </div>
                  }
                >
                  <div className='py-4'>
                    <Button
                      color='primary'
                      onPress={() => {
                        onClose()
                        onGenerateRepository(request)
                      }}
                    >
                      Ir al Repositorio de Documentos
                    </Button>
                  </div>
                </Tab>
                <Tab
                  key='history'
                  title={
                    <div className='flex items-center gap-2'>
                      <Clock size={18} />
                      <span>Historial</span>
                    </div>
                  }
                >
                  <div className='py-4'>
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-full bg-success'></div>
                        <p className='text-small'>
                          Solicitud creada el {format(new Date(request.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                      {request.updated_at !== request.created_at && (
                        <div className='flex items-center gap-2'>
                          <div className='w-2 h-2 rounded-full bg-primary'></div>
                          <p className='text-small'>
                            Última actualización el {format(new Date(request.updated_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button variant='light' onPress={onClose}>
                Cerrar
              </Button>
              <Button
                color='primary'
                onPress={() => {
                  onClose()
                  onEdit(request)
                }}
              >
                Editar Solicitud
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

function getStatusColor(status: string) {
  const statusColorMap: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
    pendiente: 'default',
    en_revision: 'primary',
    aprobada: 'success',
    rechazada: 'danger',
    cancelada: 'warning'
  }
  return statusColorMap[status] || 'default'
}
