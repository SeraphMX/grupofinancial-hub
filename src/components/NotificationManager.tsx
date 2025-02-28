import { Badge, Button, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, Bell, BellOff, BellPlus, BellRing, CheckCheck, Clock, Info } from 'lucide-react'
import { useState } from 'react'

// Ejemplos de notificaciones
const mockNotifications = [
  {
    id: '1',
    title: 'Nueva solicitud asignada',
    message: 'Se te ha asignado la solicitud #1234 para revisión',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutos atrás
  },
  {
    id: '2',
    title: 'Solicitud aprobada',
    message: 'La solicitud #1122 ha sido aprobada exitosamente',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 horas atrás
  },
  {
    id: '3',
    title: 'Recordatorio de vencimiento',
    message: 'La solicitud #998 requiere atención inmediata',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 día atrás
  },
  {
    id: '4',
    title: 'Error en el sistema',
    message: 'Hubo un problema al procesar la solicitud #887',
    type: 'error',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 días atrás
  }
]

const getIconByType = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCheck className='text-success' size={20} />
    case 'warning':
      return <Clock className='text-warning' size={20} />
    case 'error':
      return <AlertTriangle className='text-danger' size={20} />
    default:
      return <Info className='text-primary' size={20} />
  }
}

export default function NotificationManager() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const unreadCount = notifications.filter((n) => !n.read).length
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted')

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const handleNotificationsPermision = () => {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        alert('¡Notificaciones activadas!')
      } else {
        alert('Debes activar las notificaciones en la configuración del navegador.')
      }
    })
  }

  return (
    <Dropdown placement='bottom-end'>
      <DropdownTrigger>
        <Button radius='full' isIconOnly variant='light' className='relative'>
          {unreadCount > 0 && <Badge color='danger' content={unreadCount} shape='circle' className='absolute top-0 right-0' />}
          <Bell size={20} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label='Notificaciones'
        className='w-80'
        disabledKeys={['title']}
        onAction={(key) => {
          if (key === 'mark-all') {
            markAllAsRead()
          } else if (key === 'clear-all') {
            clearNotifications()
          }
        }}
      >
        <DropdownSection className='gap-2'>
          <DropdownItem key='title' className='opacity-100 '>
            <div className='flex items-center justify-between'>
              <h4 className=' font-semibold'>Notificaciones</h4>
              {notificationsEnabled ? <BellRing className='text-success' size={20} /> : <BellOff className='text-danger' size={20} />}
            </div>
          </DropdownItem>
          <DropdownItem
            onPress={handleNotificationsPermision}
            startContent={<BellPlus />}
            key='enable-notifications'
            className={`opacity-100 ${notificationsEnabled && 'hidden'}`}
          >
            Activar notificaciones
          </DropdownItem>
        </DropdownSection>
        {notifications.length > 0 ? (
          <DropdownItem key='mark-all' className='text-primary'>
            Marcar todas como leídas
          </DropdownItem>
        ) : null}

        <DropdownSection items={notifications} aria-label='notifications'>
          {(notification) => (
            <DropdownItem
              key={notification.id}
              className={`py-2 ${notification.read ? 'opacity-70' : ''}`}
              onClick={() => markAsRead(notification.id)}
              startContent={getIconByType(notification.type)}
              description={
                <div>
                  <span>{notification.message}</span>
                  <span className='text-tiny text-default-400'>{format(notification.createdAt, "d 'de' MMMM, HH:mm", { locale: es })}</span>
                </div>
              }
            >
              {notification.title}
            </DropdownItem>
          )}
        </DropdownSection>

        {notifications.length === 0 ? (
          <DropdownItem key='empty' className='text-center opacity-70'>
            No hay notificaciones
          </DropdownItem>
        ) : null}
        {notifications.length > 0 ? (
          <DropdownItem key='clear-all' className='text-danger' color='danger'>
            Limpiar todas
          </DropdownItem>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  )
}
