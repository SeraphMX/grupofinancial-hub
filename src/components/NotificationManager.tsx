import { useState } from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Badge,
  Avatar,
} from '@nextui-org/react';
import { Bell, CheckCheck, Clock, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Ejemplos de notificaciones
const mockNotifications = [
  {
    id: '1',
    title: 'Nueva solicitud asignada',
    message: 'Se te ha asignado la solicitud #1234 para revisión',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
  },
  {
    id: '2',
    title: 'Solicitud aprobada',
    message: 'La solicitud #1122 ha sido aprobada exitosamente',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
  },
  {
    id: '3',
    title: 'Recordatorio de vencimiento',
    message: 'La solicitud #998 requiere atención inmediata',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
  },
  {
    id: '4',
    title: 'Error en el sistema',
    message: 'Hubo un problema al procesar la solicitud #887',
    type: 'error',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 días atrás
  },
];

const getIconByType = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCheck className="text-success" size={20} />;
    case 'warning':
      return <Clock className="text-warning" size={20} />;
    case 'error':
      return <AlertTriangle className="text-danger" size={20} />;
    default:
      return <Info className="text-primary" size={20} />;
  }
};

export default function NotificationManager() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          radius="full"
          isIconOnly
          variant="light"
          className="relative"
        >
          {unreadCount > 0 && (
            <Badge
              color="danger"
              content={unreadCount}
              shape="circle"
              className="absolute top-0 right-0"
            />
          )}
          <Bell size={20} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Notificaciones"
        className="w-80"
        onAction={(key) => {
          if (key === 'mark-all') {
            markAllAsRead();
          } else if (key === 'clear-all') {
            clearNotifications();
          }
        }}
      >
        <DropdownItem className="gap-2" key="title">
          <p className="font-bold">Notificaciones</p>
        </DropdownItem>
        <DropdownItem key="mark-all" className="text-primary">
          Marcar todas como leídas
        </DropdownItem>
        {notifications.map((notification) => (
          <DropdownItem
            key={notification.id}
            className={`py-2 ${notification.read ? 'opacity-70' : ''}`}
            onClick={() => markAsRead(notification.id)}
            startContent={getIconByType(notification.type)}
            description={
              <div className="flex flex-col gap-1">
                <span>{notification.message}</span>
                <span className="text-tiny text-default-400">
                  {format(notification.createdAt, "d 'de' MMMM, HH:mm", { locale: es })}
                </span>
              </div>
            }
          >
            {notification.title}
          </DropdownItem>
        ))}
        {notifications.length === 0 && (
          <DropdownItem key="empty" className="text-center opacity-70">
            No hay notificaciones
          </DropdownItem>
        )}
        {notifications.length > 0 && (
          <DropdownItem key="clear-all" className="text-danger" color="danger">
            Limpiar todas
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}