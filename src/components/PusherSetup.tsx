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

    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => Notification.requestPermission())
      .then((permission) => {
        if (permission === 'granted') {
          return beamsClient.start()
        }
      })
      .then(() => beamsClient.getDeviceInterests()) // 🔍 Obtener suscripciones actuales
      .then((interests) => {
        console.log('📌 Suscripciones actuales:', interests)

        // 📌 Evitar duplicados antes de agregar
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
