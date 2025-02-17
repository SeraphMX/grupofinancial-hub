import { useEffect } from 'react';
import { Button } from '@nextui-org/react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationManager() {
  const { isSupported, permission, requestPermission } = useNotifications();

  useEffect(() => {
    // Si las notificaciones están permitidas, podemos suscribirnos a eventos del sistema
    if (permission === 'granted') {
      // Aquí podríamos conectarnos a un sistema de eventos en tiempo real
      console.log('Notificaciones activadas');
    }
  }, [permission]);

  if (!isSupported) {
    return null;
  }

  return (
    <div>
      {permission !== 'granted' && (
        <Button
          variant="flat"
          color="primary"
          startContent={<Bell size={18} />}
          onPress={requestPermission}
        >
          Activar Notificaciones
        </Button>
      )}
    </div>
  );
}