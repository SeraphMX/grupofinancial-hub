// ... (mantener el código existente)

export interface Database {
  public: {
    Tables: {
      // ... (mantener las tablas existentes)
      documentos: {
        Row: {
          id: string
          solicitud_id: string
          nombre: string
          tipo: string
          url: string
          subido_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          solicitud_id: string
          nombre: string
          tipo: string
          url: string
          subido_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          solicitud_id?: string
          nombre?: string
          tipo?: string
          url?: string
          subido_por?: string | null
          created_at?: string
        }
      }
    }
  }
}