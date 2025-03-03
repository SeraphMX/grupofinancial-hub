import { Button, Slider } from '@nextui-org/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'

import { nextStep, prevStep, setAmount, setTerm } from '../../../store/slices/creditSlice'

import { formatCurrency } from '../../../lib/utils'
import { RootState } from '../../../store'
import AmountSelector from '../AmountSelector'

const CreditoRevolvente = () => {
  const dispatch = useDispatch()
  const { step, clientType, amount, term, monthlyPayment, totalPayment, clientData, guaranteeType, isOTPVerified } = useSelector(
    (state: RootState) => state.credit
  )

  const getAmountLimits = () => {
    if (clientType === 'personal') {
      return { min: 100000, max: 10000000, step: 50000 }
    }
    return { min: 100000, max: 50000000, step: 50000 }
  }

  const { min, max, step: stepAmount } = getAmountLimits()

  return (
    <>
      <h2 className='text-xl font-semibold text-blueFinancial text-center my-2'>Condiciones crediticias</h2>
      <div>
        <AmountSelector
          amount={amount}
          minAmount={min}
          maxAmount={max}
          step={stepAmount}
          onChange={(value) => dispatch(setAmount(value))}
        />

        <div className='mb-8'>
          <div className='flex justify-between items-center mb-1'>
            <span className='text-gray-600'>Plazo</span>
            <span className='text-2xl font-bold text-blueFinancial '>{term} meses</span>
          </div>
          <Slider
            size='md'
            step={12}
            minValue={12}
            maxValue={36}
            value={term}
            onChange={(value) => dispatch(setTerm(Number(value)))}
            className='max-w-full'
            showSteps={true}
            classNames={{
              base: 'max-w-full',
              labelWrapper: 'mb-2',
              filler: 'bg-blueFinancial',
              thumb: 'bg-blueFinancial',
              track: 'border-s-blueFinancial',
              mark: 'mt-1'
            }}
          />
        </div>

        <div className='grid grid-cols-1 gap-4'>
          <div className='bg-gray-50 p-4 rounded-lg text-center'>
            <p className='text-sm text-gray-600 mb-1'>Pago mensual*</p>
            <p className='text-3xl font-bold text-blueFinancial'>{formatCurrency(monthlyPayment)}</p>
            <small className='text-gray-400'>*Calcúlo aproximado</small>
          </div>
        </div>

        <div className='flex justify-between mt-4'>
          <Button onClick={() => dispatch(prevStep())} variant='ghost' startContent={<ArrowLeft className='h-5 w-5' />}>
            Regresar
          </Button>
          <Button onClick={() => dispatch(nextStep())} variant='ghost' color='primary' endContent={<ArrowRight className='h-5 w-5' />}>
            Continuar
          </Button>
        </div>
      </div>
    </>
  )
}

export default CreditoRevolvente
