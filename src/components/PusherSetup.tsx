import { Client } from '@pusher/push-notifications-web'
import { useEffect } from 'react'

interface PusherSetupProps {
  solicitudId?: string
}

const PusherSetup: React.FC<PusherSetupProps> = ({ solicitudId }) => {
  useEffect(() => {
    const beamsClient = new Client({
      instanceId: 'dc70cf57-11c9-46ba-9e9f-c3c0ff28fd4a'
    })

    // Preguntar por los permisos ANTES de iniciar Pusher
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        beamsClient
          .start()
          .then(() => beamsClient.addDeviceInterest('general')) // Notificaciones generales
          .then(() => {
            if (solicitudId) {
              return beamsClient.addDeviceInterest(`solicitud-${solicitudId}`)
            }
          })
          .then(() => console.log('Suscripción exitosa'))
          .catch(console.error)
      } else {
        console.warn('El usuario bloqueó las notificaciones')
      }
    })

    return () => {
      if (solicitudId) {
        beamsClient.removeDeviceInterest(`solicitud-${solicitudId}`)
      }
    }
  }, [solicitudId])

  return null
}

export default PusherSetup
