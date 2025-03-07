import { Client } from '@pusher/push-notifications-web'
import { useEffect } from 'react'

interface PusherSetupProps {
  requestId: string
}

const PusherSetup: React.FC<PusherSetupProps> = ({ requestId }) => {
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
            if (requestId) {
              console.log('suscripcion a la solicitud: ', requestId)
              return beamsClient.addDeviceInterest(`debug-request-${requestId}`)
            }
          })
          .catch(console.error)
      } else {
        console.warn('El usuario bloqueó las notificaciones')
      }
    })

    // return () => {
    //   if (requestId) {
    //     beamsClient.removeDeviceInterest(`solicitud-${requestId}`)
    //   }
    // }
  }, [requestId])

  return null
}

export default PusherSetup
