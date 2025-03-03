import { AnimatePresence, motion } from 'framer-motion'
import { FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { createSolicitud, SolicitudData } from '../services/requests'
import { RootState } from '../store'
import { nextStep, resetSteps, setClientData } from '../store/slices/creditSlice'
import ClientDataForm from './simulator/ClientDataForm'
import Arrendamiento from './simulator/products/Arrendamiento'
import CreditoRevolvente from './simulator/products/CreditoRevolvente'
import CreditoSimple from './simulator/products/CreditoSimple'
import ProfileSelect from './simulator/ProfileSelect'
import RequestDetails from './simulator/RequestDetails'

interface CreditWizardProps {
  OnClose: () => void
}

const CreditWizard: FC<CreditWizardProps> = ({ OnClose }) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { step, clientType, amount, term, clientData, creditConditions, creditType } = useSelector((state: RootState) => state.credit)
  const uid = useSelector((state: RootState) => state.auth.user?.id)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log(creditType)

    dispatch(resetSteps())
  }, [dispatch, location.state, creditType])

  const handleClientDataSubmit = async (data: SolicitudData) => {
    dispatch(nextStep())
    dispatch(setClientData(data))
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const handleSendRequest = async () => {
    setLoading(true)
    try {
      await createSolicitud({
        tipo_credito: creditType,
        tipo_cliente: clientType!,
        credit_conditions: creditConditions,
        monto: amount,
        plazo: term,
        nombre: clientData.name,
        email: clientData.email,
        telefono: clientData.phone,
        rfc: clientData.rfc,
        credit_destination: clientData.creditDestination ?? null,
        clave_ciec: clientData.ciec || null,
        nombre_empresa: clientData.companyName ?? null,
        industria: clientData.industry ?? null,
        ingresos_anuales: clientData.annualRevenue ?? null,
        status: 'nueva',
        referrer: uid!
      })
      // Se cierra el modal
      setLoading(false)
      OnClose()
    } catch (error) {
      console.error('Error creating solicitud:', error)
      setLoading(false)
    }
  }

  const CreditComponents: { [key: string]: FC } = {
    simple: CreditoSimple,
    revolvente: CreditoRevolvente,
    arrendamiento: Arrendamiento
  }

  const CreditComponent = CreditComponents[creditType] || CreditoSimple

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div className='space-y-4' initial={{ x: 100 }} animate={{ x: 0 }} exit={{ opacity: 0 }}>
            <ProfileSelect />
          </motion.div>
        )
      case 2:
        return (
          <motion.div className='space-y-4' initial={{ x: 100 }} animate={{ x: 0 }} exit={{ opacity: 0 }}>
            <CreditComponent />
          </motion.div>
        )
      case 3:
        return (
          <motion.div className='space-y-4 ' initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <ClientDataForm clientType={clientType!} defaultValues={clientData} onSubmit={handleClientDataSubmit} />
          </motion.div>
        )
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} className='space-y-4 '>
            <RequestDetails onCreate={handleSendRequest} loading={loading} />
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <div className='container mt-4'>
      <div className='max-w-3xl mx-auto'>
        <AnimatePresence mode='wait'>
          <motion.div
            className='md:pb-4'
            key={step}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.1 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CreditWizard
