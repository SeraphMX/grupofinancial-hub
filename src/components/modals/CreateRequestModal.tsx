import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from '@nextui-org/react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const creditRequestSchema = z.object({
  tipo_credito: z.enum(['simple', 'revolvente', 'arrendamiento']),
  tipo_cliente: z.enum(['personal', 'empresarial']),
  tipo_garantia: z.enum(['hipotecaria', 'prendaria', 'aval', 'sin_garantia']).nullable(),
  monto: z.number().min(1000, 'El monto mínimo es 1000'),
  plazo: z.number().min(6, 'El plazo mínimo es 6 meses'),
  pago_mensual: z.number().min(1, 'El pago mensual debe ser mayor a 0'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  rfc: z.string().min(12, 'El RFC debe tener al menos 12 caracteres'),
  nombre_empresa: z.string().optional(),
  industria: z.string().optional(),
  ingresos_anuales: z.number().optional()
})

type CreditRequestForm = z.infer<typeof creditRequestSchema>

interface CreateRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreditRequestForm) => Promise<void>
}

export default function CreateRequestModal({ isOpen, onClose, onSubmit }: CreateRequestModalProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreditRequestForm>({
    resolver: zodResolver(creditRequestSchema),
    defaultValues: {
      tipo_credito: 'personal',
      tipo_cliente: 'personal',
      tipo_garantia: null,
      monto: 0,
      plazo: 12,
      pago_mensual: 0,
      nombre: '',
      email: '',
      telefono: '',
      rfc: ''
    }
  })

  const tipoCliente = watch('tipo_cliente')

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        reset()
      }}
      size='3xl'
    >
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>Nueva Solicitud de Crédito</ModalHeader>
            <ModalBody>
              <div className='grid grid-cols-2 gap-4'>
                <Controller
                  name='tipo_cliente'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Tipo de Cliente' errorMessage={errors.tipo_cliente?.message}>
                      <SelectItem key='personal' value='personal'>
                        Personal
                      </SelectItem>
                      <SelectItem key='empresarial' value='empresarial'>
                        Empresarial
                      </SelectItem>
                    </Select>
                  )}
                />

                <Controller
                  name='tipo_credito'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Tipo de Crédito' errorMessage={errors.tipo_credito?.message}>
                      <SelectItem key='simple' value='simple'>
                        Simple
                      </SelectItem>
                      <SelectItem key='revolvente' value='revolvente'>
                        Revolvente
                      </SelectItem>
                      <SelectItem key='arrendamiento' value='arrendamiento'>
                        Arrendamiento
                      </SelectItem>
                    </Select>
                  )}
                />

                <Controller
                  name='nombre'
                  control={control}
                  render={({ field }) => <Input {...field} label='Nombre' errorMessage={errors.nombre?.message} required />}
                />

                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => <Input {...field} type='email' label='Email' errorMessage={errors.email?.message} />}
                />

                <Controller
                  name='telefono'
                  control={control}
                  render={({ field }) => <Input {...field} label='Teléfono' errorMessage={errors.telefono?.message} />}
                />

                <Controller
                  name='rfc'
                  control={control}
                  render={({ field }) => <Input {...field} label='RFC' errorMessage={errors.rfc?.message} />}
                />

                {tipoCliente === 'empresarial' && (
                  <>
                    <Controller
                      name='nombre_empresa'
                      control={control}
                      render={({ field }) => (
                        <Input {...field} label='Nombre de la Empresa' errorMessage={errors.nombre_empresa?.message} />
                      )}
                    />

                    <Controller
                      name='industria'
                      control={control}
                      render={({ field }) => <Input {...field} label='Industria' errorMessage={errors.industria?.message} />}
                    />

                    <Controller
                      name='ingresos_anuales'
                      control={control}
                      render={({ field: { onChange, ...field } }) => (
                        <Input
                          {...field}
                          type='number'
                          label='Ingresos Anuales'
                          onChange={(e) => onChange(Number(e.target.value))}
                          errorMessage={errors.ingresos_anuales?.message}
                        />
                      )}
                    />
                  </>
                )}

                <Controller
                  name='monto'
                  control={control}
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      {...field}
                      type='number'
                      label='Monto'
                      onChange={(e) => onChange(Number(e.target.value))}
                      errorMessage={errors.monto?.message}
                    />
                  )}
                />

                <Controller
                  name='plazo'
                  control={control}
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      {...field}
                      type='number'
                      label='Plazo (meses)'
                      onChange={(e) => onChange(Number(e.target.value))}
                      errorMessage={errors.plazo?.message}
                    />
                  )}
                />

                <Controller
                  name='tipo_garantia'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Tipo de Garantía' errorMessage={errors.tipo_garantia?.message}>
                      <SelectItem key='hipotecaria' value='hipotecaria'>
                        Hipotecaria
                      </SelectItem>
                      <SelectItem key='prendaria' value='prendaria'>
                        Prendaria
                      </SelectItem>
                      <SelectItem key='aval' value='aval'>
                        Aval
                      </SelectItem>
                      <SelectItem key='sin_garantia' value='sin_garantia'>
                        Sin Garantía
                      </SelectItem>
                    </Select>
                  )}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant='light' onPress={onClose}>
                Cancelar
              </Button>
              <Button color='primary' type='submit' isLoading={isSubmitting}>
                Crear Solicitud
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}
