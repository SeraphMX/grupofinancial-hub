import { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtime(table: string, onChange: () => void, filter?: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    console.log(`🟢 Suscribiendo a cambios en la tabla ${table}${filter ? ` con filtro: ${filter}` : ''}`)

    const newChannel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, onChange)
      .subscribe((status) => {
        console.log('🔗 Estado de conexión:', status)
      })

    setChannel(newChannel)

    return () => {
      console.log(`⛔ Cancelando suscripción a la tabla ${table}`)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, filter, onChange]) // Agregamos `filter` como dependencia opcional
}
