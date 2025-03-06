import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Request {
  id: string
  tipo_credito: string
  tipo_cliente: string
  credit_conditions: string | null
  monto: number
  plazo: number
  nombre: string
  email: string
  telefono: string
  rfc: string
  nombre_empresa: string | null
  industria: string | null
  ingresos_anuales: number | null
  status: string
  ip_address: string
  user_agent: string
  created_at: string
  updated_at: string
  assigned_to: string | null
  clave_ciec: string | null
  credit_destination: string | null
  password: string | null
  status_description: string | null
  referrer: string | null
}

interface RequestState {
  selectedRequest: Request | null
}

const initialState: RequestState = {
  selectedRequest: null
}

const requestSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    setSelectedRequest(state, action: PayloadAction<Request | null>) {
      state.selectedRequest = action.payload
    },
    clearSelectedRequest(state) {
      state.selectedRequest = null
    }
  }
})

export const { setSelectedRequest, clearSelectedRequest } = requestSlice.actions

export default requestSlice.reducer
