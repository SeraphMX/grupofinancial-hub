import { Button, cn, Radio, RadioGroup } from '@nextui-org/react'
import { ArrowRight, Building2, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useIsMobile } from '../../hooks/useIsMobile'
import { RootState } from '../../store'
import { ClientType, CreditType, nextStep, setClientType, setCreditConditions, setCreditType } from '../../store/slices/creditSlice'

const ProfileSelect = () => {
  const dispatch = useDispatch()

  const { creditType, clientType, step } = useSelector((state: RootState) => state.credit)

  const handleClientTypeSelect = (type: ClientType) => {
    dispatch(setClientType(type))
  }

  const isMobile = useIsMobile()

  return (
    <>
      <h2 className='text-xl font-semibold text-blueFinancial text-center my-2'>Perfil de crédito</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <button
          onClick={() => handleClientTypeSelect('personal')}
          className={`bg-white flex gap-4 p-6 rounded-xl border-2 text-left transition-all ${
            clientType === 'personal' ? 'border-blueFinancial bg-primary/10' : 'border-gray-200 hover:border-primary/50'
          }`}
        >
          <User className='w-12 h-12  text-blueFinancial' />
          <div>
            <h3 className='text-lg font-semibold text-blueFinancial '>Personal</h3>
            <p className='text-gray-600'>Financiamiento individual </p>
          </div>
        </button>
        <button
          onClick={() => handleClientTypeSelect('business')}
          className={`bg-white flex gap-4 p-6 rounded-xl border-2 text-left transition-all ${
            clientType === 'business' ? 'border-blueFinancial bg-primary/10' : 'border-gray-200 hover:border-primary/50'
          }`}
        >
          <Building2 className='w-12 h-12  text-blueFinancial' />
          <div>
            <h3 className='text-lg font-semibold text-blueFinancial'>Negocio</h3>
            <p className='text-gray-600'>Para PyMEs y empresas</p>
          </div>
        </button>
      </div>
      <div>
        <RadioGroup
          label='Producto'
          name='tipo_credito'
          value={creditType}
          onValueChange={(value) => {
            dispatch(setCreditType(value as CreditType))
            if (value === 'simple') {
              dispatch(setCreditConditions('sin-garantia'))
            } else if (value === 'arrendamiento') {
              dispatch(setCreditConditions('puro'))
            } else {
              dispatch(setCreditConditions(null))
            }
          }}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          classNames={{
            label: cn('text-blueFinancial', 'font-semibold', 'font-montserrat', 'mb-2', 'text-lg')
          }}
        >
          <Radio value='simple'>Crédito Simple</Radio>
          <Radio value='revolvente'>Crédito Revolvente</Radio>
          <Radio value='arrendamiento'>Arrendamiento</Radio>
        </RadioGroup>

        <div className='flex justify-end mt-4'>
          <Button onClick={() => dispatch(nextStep())} variant='ghost' color='primary' endContent={<ArrowRight className='h-5 w-5' />}>
            Continuar
          </Button>
        </div>
      </div>
    </>
  )
}

export default ProfileSelect
