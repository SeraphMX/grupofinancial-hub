import {
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Selection,
  SortDescriptor,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure
} from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown, ContactRound, Filter, MoreVertical, Plus, Search, TextSearch, Trash } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CancelRequestModal from '../components/modals/CancelRequestModal'
import CreateRequestModal from '../components/modals/CreateRequestModal'
import DeleteRequestModal from '../components/modals/DeleteRequestModal'
import ViewRequestModal from '../components/modals/ViewRequestModal'
import { useRealtime } from '../hooks/useRealTime'
import { supabase } from '../lib/supabase'

const statusColorMap: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  nueva: 'primary',
  en_revision: 'warning',
  documentacion: 'secondary',
  completada: 'success',
  aprobada: 'success',
  rechazada: 'danger',
  cancelada: 'danger'
}

export default function CreditRequests() {
  const navigate = useNavigate()
  const [filterValue, setFilterValue] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending'
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('all')

  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('solicitudes').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useRealtime('solicitudes', fetchRequests)

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleCreateRequest = async (data: any) => {
    try {
      const { error } = await supabase.from('solicitudes').insert([
        {
          ...data,
          status: 'pendiente'
        }
      ])

      if (error) throw error
      onCreateClose()
    } catch (error) {
      console.error('Error creating request:', error)
    }
  }

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return

    try {
      const { error } = await supabase.from('solicitudes').delete().eq('id', selectedRequest.id)

      if (error) throw error
      onDeleteClose()
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error deleting request:', error)
    }
  }

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request)
    onViewOpen()
  }

  const handleEditRequest = (request: any) => {
    setSelectedRequest(request)
    onEditOpen()
  }

  const handleCancelRequest = async () => {
    if (!selectedRequest) return

    console.log('Canceling request:', selectedRequest)

    try {
      const { error } = await supabase.from('solicitudes').update({ status: 'cancelada' }).eq('id', selectedRequest.id)

      if (error) throw error
      onCancelClose()
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error canceling request:', error)
    }
  }

  const handleGenerateRepository = (request: any) => {
    window.open(`/solicitud/${request.id}`, '_blank')
  }

  const filteredRequests = useMemo(() => {
    let filtered = [...requests]

    if (filterValue) {
      filtered = filtered.filter(
        (request) =>
          request.nombre.toLowerCase().includes(filterValue.toLowerCase()) ||
          request.email?.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((request) => request.tipo_credito === typeFilter)
    }

    if (clientTypeFilter !== 'all') {
      filtered = filtered.filter((request) => request.tipo_cliente === clientTypeFilter)
    }

    return filtered.sort((a, b) => {
      const { column, direction } = sortDescriptor
      let first = a[column as keyof typeof a]
      let second = b[column as keyof typeof b]

      if (column === 'monto' || column === 'plazo') {
        first = Number(first)
        second = Number(second)
      }

      if (column === 'created_at' || column === 'updated_at') {
        first = new Date(first).getTime()
        second = new Date(second).getTime()
      }

      let cmp = first < second ? -1 : first > second ? 1 : 0
      return direction === 'descending' ? -cmp : cmp
    })
  }, [requests, filterValue, statusFilter, typeFilter, clientTypeFilter, sortDescriptor])

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Solicitudes de Crédito</h2>
        <Button color='primary' startContent={<Plus size={18} />} onPress={onCreateOpen}>
          Nueva Solicitud
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap gap-3 justify-between'>
              <Input
                isClearable
                className='flex-1'
                placeholder='Buscar por nombre o email...'
                startContent={<Search className='text-default-300' size={18} />}
                value={filterValue}
                onClear={() => setFilterValue('')}
                onChange={(e) => setFilterValue(e.target.value)}
              />

              <Dropdown>
                <DropdownTrigger>
                  <Button variant='flat' startContent={<Filter size={18} />} endContent={<ChevronDown size={18} />}>
                    Estado
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  selectedKeys={[statusFilter]}
                  selectionMode='single'
                  onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
                >
                  <DropdownItem key='all'>Todos</DropdownItem>
                  <DropdownItem key='nueva'>Nueva</DropdownItem>
                  <DropdownItem key='revision'>En Revisión</DropdownItem>
                  <DropdownItem key='documentacion'>Documentacion</DropdownItem>
                  <DropdownItem key='completa'>Completa</DropdownItem>
                  <DropdownItem key='rechazada'>Completa</DropdownItem>
                  <DropdownItem key='cancelada'>Cancelada</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button variant='flat' startContent={<Filter size={18} />} endContent={<ChevronDown size={18} />}>
                    Tipo de Crédito
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  selectedKeys={[typeFilter]}
                  selectionMode='single'
                  onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0] as string)}
                >
                  <DropdownItem key='all'>Todos</DropdownItem>
                  <DropdownItem key='simple'>Simple</DropdownItem>
                  <DropdownItem key='revolvente'>Revolvente</DropdownItem>
                  <DropdownItem key='arrendamiento'>Arrendamiento</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button variant='flat' startContent={<Filter size={18} />} endContent={<ChevronDown size={18} />}>
                    Tipo de Cliente
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  selectedKeys={[clientTypeFilter]}
                  selectionMode='single'
                  onSelectionChange={(keys) => setClientTypeFilter(Array.from(keys)[0] as string)}
                >
                  <DropdownItem key='all'>Todos</DropdownItem>
                  <DropdownItem key='personal'>Personal</DropdownItem>
                  <DropdownItem key='empresarial'>Empresarial</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>

            <Table
              aria-label='Tabla de solicitudes'
              isHeaderSticky
              selectionMode='multiple'
              selectionBehavior='replace'
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
              onRowAction={(key) => {
                const request = filteredRequests.find((r) => r.id === key)
                if (request) handleViewRequest(request)
              }}
              classNames={{
                wrapper: 'max-h-[600px]'
              }}
            >
              <TableHeader>
                <TableColumn key='nombre' allowsSorting>
                  NOMBRE
                </TableColumn>
                <TableColumn key='tipo_cliente' allowsSorting>
                  TIPO CLIENTE
                </TableColumn>
                <TableColumn key='tipo_credito' allowsSorting>
                  TIPO CRÉDITO
                </TableColumn>
                <TableColumn key='monto' allowsSorting>
                  MONTO
                </TableColumn>
                <TableColumn key='status' allowsSorting>
                  ESTADO
                </TableColumn>
                <TableColumn key='updated_at' allowsSorting>
                  ACTUALIZADO
                </TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody
                items={filteredRequests}
                isLoading={loading}
                loadingContent={<Spinner color='primary' label='Cargando Solicitudes...' />}
                emptyContent={
                  <div className='py-8 text-center text-default-500'>
                    {loading ? <Spinner color='primary' label='Cargando Solicitudes...' /> : 'No hay solicitudes disponibles'}
                  </div>
                }
              >
                {(request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.nombre}</TableCell>
                    <TableCell>
                      <Chip variant='flat' color='primary'>
                        {request.tipo_cliente === 'personal' ? 'Personal' : 'Empresarial'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip variant='flat' color='secondary'>
                        {request.tipo_credito.charAt(0).toUpperCase() + request.tipo_credito.slice(1)}
                      </Chip>
                    </TableCell>
                    <TableCell>${request.monto.toLocaleString('es-ES')}</TableCell>

                    <TableCell>
                      <Chip variant='flat' color={statusColorMap[request.status]}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Chip>
                    </TableCell>
                    <TableCell>{format(new Date(request.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size='sm' variant='light'>
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label='Acciones'>
                          <DropdownItem key='view' startContent={<TextSearch size={18} />} onPress={() => handleViewRequest(request)}>
                            Ver detalles
                          </DropdownItem>
                          {request.status !== 'cancelada' && request.status !== 'rechazada' ? (
                            <DropdownItem key='repository' startContent={<ContactRound size={18} />}>
                              <Link to={`/solicitud/${request.id}`} target='_blank'>
                                Vista del cliente
                              </Link>
                            </DropdownItem>
                          ) : null}

                          {request.status === 'cancelada' || request.status === 'rechazada' ? (
                            <DropdownItem
                              key='delete'
                              className='text-danger'
                              color='danger'
                              startContent={<Trash size={18} />}
                              onPress={() => {
                                setSelectedRequest(request)
                                onDeleteOpen()
                              }}
                            >
                              Eliminar
                            </DropdownItem>
                          ) : (
                            <DropdownItem
                              key='cancel'
                              className='text-danger'
                              color='danger'
                              startContent={<Trash size={18} />}
                              onPress={() => {
                                setSelectedRequest(request)
                                onCancelOpen()
                              }}
                            >
                              Cancelar
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Modales */}
      <ViewRequestModal
        isOpen={isViewOpen}
        onClose={onViewClose}
        request={selectedRequest}
        onEdit={handleEditRequest}
        onGenerateRepository={handleGenerateRepository}
      />

      <CreateRequestModal isOpen={isCreateOpen} onClose={onCreateClose} onSubmit={handleCreateRequest} />

      <DeleteRequestModal isOpen={isDeleteOpen} onClose={onDeleteClose} onDelete={handleDeleteRequest} />

      <CancelRequestModal isOpen={isCancelOpen} onClose={onCancelClose} onCancel={handleCancelRequest} />
    </div>
  )
}
