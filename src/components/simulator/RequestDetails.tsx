import { useDispatch, useSelector } from 'react-redux'

import { Button } from '@nextui-org/react'
import { ArrowLeft, PlusCircleIcon, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { RootState } from '../../store'
import { prevStep } from '../../store/slices/creditSlice'

const RequestDetails = ({ onCreate, loading }: { onCreate: () => void; loading: boolean }) => {
  const dispatch = useDispatch()
  const { clientType, amount, term, clientData, creditType, creditConditions } = useSelector((state: RootState) => state.credit)

  return (
    <>
      <div className='text-center'>
        <h2 className='text-xl font-bold text-blueFinancial mb-2'>Revisa los datos de la solicitud</h2>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <p className='text-sm text-gray-600'>Tipo de Cliente</p>
          <p className=''>{clientType === 'personal' ? 'Personal' : 'Empresarial'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-600'>Tipo de Crédito</p>
          <p className=''>
            {creditType.charAt(0).toUpperCase() + creditType.slice(1)} {creditConditions}
          </p>
        </div>
        <div>
          <p className='text-sm text-gray-600'>Monto Solicitado</p>
          <p className=''>{formatCurrency(amount)}</p>
        </div>
        <div>
          <p className='text-sm text-gray-600'>Plazo</p>
          <p className=''>{term} meses</p>
        </div>

        <div className='col-span-2 sm:col-auto'>
          <p className='text-sm text-gray-600'>Nombre</p>
          <p className=''>{clientData.name}</p>
        </div>

        <div>
          <p className='text-sm text-gray-600'>Correo electrónico</p>
          <p className=''>{clientData.email}</p>
        </div>

        <div>
          <p className='text-sm text-gray-600'>Teléfono</p>
          <p className=''>{clientData.phone}</p>
        </div>

        <div>
          <p className='text-sm text-gray-600'>RFC</p>
          <p className=''>{clientData.rfc}</p>
        </div>

        {clientType !== 'personal' && (
          <>
            <div>
              <p className='text-sm text-gray-600'>Nombre de la empresa</p>
              <p className=''>{clientData.companyName}</p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Industria</p>
              <p className=''>{clientData.industry}</p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Ingresos anuales</p>
              <p className=''>{clientData.annualRevenue}</p>
            </div>
          </>
        )}
        {clientData.creditDestination && (
          <div className='col-span-2 sm:col-auto'>
            <p className='text-sm text-gray-600'>Destino del crédito</p>
            <p className=''>{clientData.creditDestination}</p>
          </div>
        )}
        {clientData.ciec && (
          <div className='flex  items-center text-success gap-1 col-span-2 sm:col-auto'>
            <ShieldCheck size={30} />
            <div>
              <p className=''>Clave CIEC almacenada</p>
              <p className='text-tiny text-gray-600'>*Se puede cambiar más adelante</p>
            </div>
          </div>
        )}
      </div>

      <div className='flex justify-between'>
        <Button
          onClick={() => {
            dispatch(prevStep())
          }}
          className='mt-4'
          variant='ghost'
          startContent={<ArrowLeft className='h-5 w-5' />}
        >
          Regresar
        </Button>
        <Button className='mt-4' variant='ghost' color='primary' onPress={onCreate} isLoading={loading}>
          <PlusCircleIcon className='mr-1' />
          Agregar Solicitud
        </Button>
      </div>
    </>
  )
}

export default RequestDetails
