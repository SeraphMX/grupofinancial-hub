import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  User
} from '@nextui-org/react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Edit, Key, Mail, Phone, Search, Shield, Trash, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../lib/supabase'

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'El nombre es requerido'),
  role: z.enum(['admin', 'agent', 'supervisor'], {
    required_error: 'El rol es requerido'
  }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  document_id: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

type UserForm = z.infer<typeof userSchema>

const roleColorMap = {
  admin: 'danger',
  agent: 'primary',
  supervisor: 'warning'
} as const

const roleTextMap = {
  admin: 'Administrador',
  agent: 'Agente',
  supervisor: 'Supervisor'
} as const

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterValue, setFilterValue] = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'agent',
      password: '',
      phone: '',
      address: '',
      document_id: '',
      status: 'active'
    }
  })

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtime = async () => {
      channel = supabase
        .channel('users_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users'
          },
          async () => {
            await fetchUsers()
          }
        )
        .subscribe()
    }

    fetchUsers()
    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (data: UserForm) => {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password || 'temporal123',
        options: {
          data: {
            name: data.name,
            role: data.role
          }
        }
      })

      if (signUpError) throw signUpError

      const { error: insertError } = await supabase.from('users').insert([
        {
          email: data.email,
          name: data.name,
          role: data.role,
          phone: data.phone,
          status: data.status
        }
      ])

      if (insertError) throw insertError

      onClose()
      reset()
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const handleUpdateUser = async (data: UserForm) => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          role: data.role,
          phone: data.phone,
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      onClose()
      reset()
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase.from('users').delete().eq('id', selectedUser.id)

      if (error) throw error

      onDeleteClose()
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const filteredUsers = users.filter(
    (user) => user.name?.toLowerCase().includes(filterValue.toLowerCase()) || user.email?.toLowerCase().includes(filterValue.toLowerCase())
  )

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Gestión de Usuarios</h2>
      </div>

      <Card>
        <CardBody className='flex flex-row justify-between items-center gap-4'>
          <Input
            className='max-w-72'
            isClearable
            placeholder='Buscar por nombre o email...'
            startContent={<Search className='text-default-300' size={18} />}
            value={filterValue}
            onClear={() => setFilterValue('')}
            onChange={(e) => setFilterValue(e.target.value)}
          />
          <Button
            color='primary'
            startContent={<UserPlus size={18} />}
            onPress={() => {
              setSelectedUser(null)
              reset()
              onOpen()
            }}
          >
            Nuevo Usuario
          </Button>
        </CardBody>
      </Card>

      <Table
        aria-label='Tabla de usuarios'
        isHeaderSticky
        classNames={{
          wrapper: 'max-h-[600px]'
        }}
      >
        <TableHeader>
          <TableColumn>USUARIO</TableColumn>
          <TableColumn>ROL</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>FECHA DE CREACIÓN</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          items={filteredUsers}
          isLoading={loading}
          loadingContent={<Spinner color='primary' label='Cargando Usuarios...' />}
          emptyContent={
            <div className='py-8 text-center text-default-500'>
              {loading ? <Spinner color='primary' label='Cargando Usuarios...' /> : 'No hay usuarios disponibles'}
            </div>
          }
        >
          {(user) => (
            <TableRow key={user.id}>
              <TableCell>
                <User
                  avatarProps={{
                    src: `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}&chars=1`
                  }}
                  description={user.email}
                  name={user.name}
                />
              </TableCell>
              <TableCell>
                <Chip variant='flat' color={roleColorMap[user.role as keyof typeof roleColorMap]}>
                  {roleTextMap[user.role as keyof typeof roleTextMap]}
                </Chip>
              </TableCell>

              <TableCell>
                <Chip variant='flat' color={user.status === 'active' ? 'success' : 'danger'}>
                  {user.status === 'active' ? 'Activo' : 'Inactivo'}
                </Chip>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Calendar size={16} className='text-default-400' />
                  {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es })}
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Button
                    isIconOnly
                    size='sm'
                    variant='light'
                    onPress={() => {
                      setSelectedUser(user)
                      reset({
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        phone: user.phone || '',
                        address: user.address || '',
                        document_id: user.document_id || '',
                        status: user.status
                      })
                      onOpen()
                    }}
                  >
                    <Edit size={18} />
                  </Button>
                  <Button
                    isIconOnly
                    size='sm'
                    variant='light'
                    color='danger'
                    onPress={() => {
                      setSelectedUser(user)
                      onDeleteOpen()
                    }}
                  >
                    <Trash size={18} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal de Crear/Editar Usuario */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose()
          setSelectedUser(null)
          reset()
        }}
        size='2xl'
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit(selectedUser ? handleUpdateUser : handleCreateUser)}>
              <ModalHeader>{selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}</ModalHeader>
              <ModalBody>
                <div className='grid grid-cols-2 gap-6'>
                  <Controller
                    name='email'
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label='Email'
                        placeholder='correo@ejemplo.com'
                        startContent={<Mail className='text-default-400' size={16} />}
                        errorMessage={errors.email?.message}
                        isDisabled={!!selectedUser}
                      />
                    )}
                  />
                  <Controller
                    name='phone'
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label='Teléfono'
                        placeholder='Número de teléfono'
                        startContent={<Phone className='text-default-400' size={16} />}
                        errorMessage={errors.phone?.message}
                      />
                    )}
                  />
                  <Controller
                    name='name'
                    control={control}
                    render={({ field }) => (
                      <Input {...field} label='Nombre' placeholder='Nombre completo' errorMessage={errors.name?.message} />
                    )}
                  />
                  <Controller
                    name='role'
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label='Rol'
                        placeholder='Seleccione un rol'
                        startContent={<Shield className='text-default-400' size={16} />}
                        errorMessage={errors.role?.message}
                        defaultSelectedKeys={[selectedUser?.role || 'agent']}
                      >
                        <SelectItem key='admin' value='admin'>
                          Administrador
                        </SelectItem>
                        <SelectItem key='agent' value='agent'>
                          Agente
                        </SelectItem>
                        <SelectItem key='supervisor' value='supervisor'>
                          Supervisor
                        </SelectItem>
                      </Select>
                    )}
                  />
                  {!selectedUser && (
                    <Controller
                      name='password'
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type='password'
                          label='Contraseña'
                          placeholder='Contraseña temporal'
                          startContent={<Key className='text-default-400' size={16} />}
                          errorMessage={errors.password?.message}
                        />
                      )}
                    />
                  )}

                  <Controller
                    name='status'
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label='Estado'
                        placeholder='Seleccione un estado'
                        errorMessage={errors.status?.message}
                        defaultSelectedKeys={[selectedUser?.status || 'active']}
                      >
                        <SelectItem key='active' value='active'>
                          Activo
                        </SelectItem>
                        <SelectItem key='inactive' value='inactive'>
                          Inactivo
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
                  {selectedUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size='sm'>
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleDeleteUser()
              }}
            >
              <ModalHeader>Confirmar Eliminación</ModalHeader>
              <ModalBody>¿Está seguro que desea eliminar al usuario {selectedUser?.name}? Esta acción no se puede deshacer.</ModalBody>
              <ModalFooter>
                <Button variant='light' onPress={onClose}>
                  Cancelar
                </Button>
                <Button color='danger' type='submit'>
                  Eliminar
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
