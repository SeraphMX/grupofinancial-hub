import { Slider } from '@nextui-org/react'

interface AmountSelectorProps {
  amount: number
  minAmount: number
  maxAmount: number
  step: number
  onChange: (value: number) => void
}

const AmountSelector = ({ amount, minAmount, maxAmount, step, onChange }: AmountSelectorProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className='mb-5'>
      <div className='flex justify-between items-center mb-1'>
        <span className='text-gray-600'>Monto</span>
        <span className='text-3xl font-bold text-blueFinancial flex items-center'>{formatCurrency(amount)}</span>
      </div>

      <Slider
        size='md'
        step={step}
        minValue={minAmount}
        maxValue={maxAmount}
        value={amount}
        onChange={(value) => onChange(Number(value))}
        color='primary'
        classNames={{
          filler: 'bg-blueFinancial',
          thumb: 'bg-blueFinancial',
          track: 'border-s-blueFinancial',
          mark: 'mt-1  ',
          labelWrapper: 'mt-5 bg-red-500'
        }}
      />
    </div>
  )
}

export default AmountSelector
