import { Client } from '@pusher/push-notifications-web'
import { useEffect } from 'react'

interface PusherSetupProps {
  requestId: string
}

const PusherSetup: React.FC<PusherSetupProps> = ({ requestId }) => {
  useEffect(() => {
    // 1️⃣ Verificar compatibilidad antes de ejecutar Pusher Beams
    if (
      typeof Notification === 'undefined' || // 📌 Safari en iOS no soporta Notification
      typeof navigator.serviceWorker === 'undefined' || // 📌 No hay Service Worker
      typeof window.PushManager === 'undefined' // 📌 Web Push no disponible
    ) {
      console.warn('🚫 Web Push no es compatible en este navegador.')
      return
    }

    const beamsClient = new Client({
      instanceId: 'dc70cf57-11c9-46ba-9e9f-c3c0ff28fd4a'
    })

    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => Notification.requestPermission())
      .then((permission) => {
        if (permission === 'granted') {
          return beamsClient.start()
        } else {
          console.warn('⚠️ Permiso de notificación denegado.')
          return null
        }
      })
      .then(() => beamsClient.getDeviceInterests())
      .then((interests) => {
        console.log('📌 Suscripciones actuales:', interests)

        if (!interests.includes('general')) {
          beamsClient.addDeviceInterest('general')
        }

        if (requestId) {
          const requestInterest = `debug-request-${requestId}`
          if (!interests.includes(requestInterest)) {
            console.log(`✅ Suscribiendo a ${requestInterest}`)
            beamsClient.addDeviceInterest(requestInterest)
          } else {
            console.log(`⚠️ Ya suscrito a ${requestInterest}, omitiendo...`)
          }
        }
      })
      .catch(console.error)
  }, [requestId])

  return null
}

export default PusherSetup
