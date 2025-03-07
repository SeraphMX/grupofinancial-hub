import { Badge, Button, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertTriangle,
  Bell,
  BellOff,
  BellPlus,
  BellRing,
  CalendarClock,
  CheckCheck,
  CircleOff,
  Clock,
  CloudDownload,
  CloudUpload,
  FileCheck2,
  FileLock2,
  FileMinus,
  FilePlus,
  FilePlus2,
  FileSearch,
  Info,
  ListChecks,
  SmilePlus,
  Trash,
  UserRoundPlus
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRealtime } from '../hooks/useRealTime'
import { supabase } from '../lib/supabase'
import { formatCurrencyCNN } from '../lib/utils'
import { RootState } from '../store'
import { setNotificationOpened, setNotificationType } from '../store/slices/notificationsSlice'
import { setSelectedRequest } from '../store/slices/requestSlice'

interface Notification {
  id: number
  request_id: string
  uid: string
  type: string
  title: string
  message: string
  icon: keyof typeof iconMap
  color: string
  created_at: Date
  is_read: boolean
  request_data: any
}

const iconMap = {
  AlertTriangle,
  CalendarClock,
  CheckCheck,
  CircleOff,
  Clock,
  CloudDownload,
  CloudUpload,
  FileCheck2,
  FileLock2,
  FileMinus,
  FilePlus,
  FilePlus2,
  FileSearch,
  Info,
  ListChecks,
  SmilePlus,
  UserRoundPlus
} as const

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter((n) => !n.is_read).length
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted')
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const uid = useSelector((state: RootState) => state.auth.user?.id)

  const fetchNotifications = useCallback(async () => {
    if (!uid) return

    try {
      const { data, error } = await supabase.from('notifications').select('*').eq('uid', uid).order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [uid])

  // Use realtime subscription with filter
  useRealtime('notifications', fetchNotifications, `uid=eq.${uid}`)

  useEffect(() => {
    if (uid) {
      fetchNotifications()
    }
  }, [fetchNotifications, uid])

  const markAsRead = async ({ notification }: { notification: Notification }) => {
    if (location.pathname !== '/solicitudes') {
      navigate('/solicitudes')
    }

    try {
      const { data, error } = await supabase.from('solicitudes').select('*').eq('id', notification.request_id).single()

      if (error) throw error
      dispatch(setSelectedRequest(data))
      dispatch(setNotificationOpened(true))
      dispatch(setNotificationType(notification.type))

      // Only update if not already read
      if (!notification.is_read) {
        const { error: updateError } = await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id)

        if (updateError) throw updateError

        // Update local state
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
      }
    } catch (error) {
      console.error('Error updating notification:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('uid', uid).eq('is_read', false)

      if (error) throw error

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Error updating notifications:', error)
    }
  }

  const clearNotifications = async () => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('uid', uid)

      if (error) throw error

      // Clear local state
      setNotifications([])
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  const handleNotificationsPermission = () => {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        alert('¡Notificaciones activadas!')
      } else {
        alert('Debes activar las notificaciones en la configuración del navegador.')
      }
    })
  }

  const handleDeleteNotification = async (notification: Notification) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notification.id)

      if (error) throw error

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  return (
    <Dropdown placement='bottom-end'>
      <DropdownTrigger>
        <Button radius='sm' isIconOnly variant='light' className='relative overflow-visible' disableRipple>
          <Badge
            color='danger'
            content={unreadCount}
            shape='circle'
            className='absolute -top-1 -right-1 pointer-events-none'
            isInvisible={unreadCount === 0}
          >
            <Bell size={20} />
          </Badge>
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
          <DropdownItem key='title' className='opacity-100'>
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold'>Notificaciones</h4>
              {notificationsEnabled ? <BellRing className='text-success' size={20} /> : <BellOff className='text-danger' size={20} />}
            </div>
          </DropdownItem>
          <DropdownItem
            onPress={handleNotificationsPermission}
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
        <DropdownSection items={notifications} aria-label='notifications' className='max-h-[300px] overflow-y-auto'>
          {notifications.map((notification) => {
            const IconComponent = iconMap[notification.icon] || Info
            return (
              <DropdownItem
                key={notification.id}
                className={`py-2 ${notification.is_read ? 'opacity-70' : ''}`}
                onClick={() => markAsRead({ notification })}
                startContent={<IconComponent className={`text-${notification.color}`} size={20} />}
                endContent={
                  <Button isIconOnly variant='light' color='danger' size='sm' onPress={() => handleDeleteNotification(notification)}>
                    <Trash size={16} />
                  </Button>
                }
                description={
                  <div>
                    <span className='text-tiny text-default-400'>
                      {format(new Date(notification.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                    </span>
                  </div>
                }
              >
                <div className='flex flex-col gap-1 text-medium'>
                  {notification.title}
                  <span className='text-small'>
                    {`de ${notification.request_data.nombre} (${formatCurrencyCNN(notification.request_data.monto)})`}
                    {notification.type.includes('doc') ? ` - ${notification.message}` : ''}
                  </span>
                </div>
              </DropdownItem>
            )
          })}
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
