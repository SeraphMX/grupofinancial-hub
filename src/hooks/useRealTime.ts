import type { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtime(table: string, fetchData: () => Promise<void>) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const setupRealtime = async () => {
      console.log(`🟢 Configurando conexión en tiempo real para la tabla: ${table}...`)
      await unsubscribeRealtimeConnection()

      const newChannel = supabase
        .channel(`${table}_changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
          console.log(`🔄 Cambio detectado en ${table}, recargando datos...`)
          await fetchData()
        })
        .subscribe((status) => {
          console.log('🔗 Estado de conexión:', status)
        })

      setChannel(newChannel)
    }

    const unsubscribeRealtimeConnection = async () => {
      if (channel) {
        console.log(`⛔ Eliminando suscripción previa de ${table}...`)
        await supabase.removeChannel(channel)
        setChannel(null)
      }
    }

    setupRealtime()

    return () => {
      unsubscribeRealtimeConnection()
    }
  }, [table, fetchData]) // Se ejecuta cada vez que cambie la tabla o la función fetchData

  return { channel }
}
