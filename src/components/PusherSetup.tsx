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

    // 📌 REGISTRAR EXPLÍCITAMENTE EL SERVICE WORKER
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado correctamente:', registration)

        // 🚀 AHORA inicia Pusher Beams
        return Notification.requestPermission()
      })
      .then((permission) => {
        if (permission === 'granted') {
          return beamsClient.start()
        } else {
          console.warn('El usuario bloqueó las notificaciones')
          return null
        }
      })
      .then(() => {
        return beamsClient.addDeviceInterest('general') // Notificaciones generales
      })
      .then(() => {
        if (requestId) {
          console.log('📌 Suscripción a la solicitud: ', requestId)
          return beamsClient.addDeviceInterest(`debug-request-${requestId}`)
        }
      })
      .catch(console.error)
  }, [requestId])

  return null
}

export default PusherSetup
