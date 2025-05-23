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
  Popover,
  PopoverContent,
  PopoverTrigger,
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
import {
  ChevronDown,
  CircleX,
  ContactRound,
  Filter,
  FilterX,
  LayoutList,
  MoreVertical,
  Plus,
  Search,
  TextSearch,
  Trash
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import CancelRequestModal from '../components/modals/CancelRequestModal'
import CreateRequestModal from '../components/modals/CreateRequestModal'
import DeleteRequestModal from '../components/modals/DeleteRequestModal'
import ViewRequestModal from '../components/modals/ViewRequestModal'
import { getRequestStatusConfig } from '../constants/creditRequests'
import { useIsMobile } from '../hooks/useIsMobile'
import { useRealtime } from '../hooks/useRealTime'
import { supabase } from '../lib/supabase'
import { RootState } from '../store'
import { clearSelectedRequest, setSelectedRequest } from '../store/slices/requestSlice'

export default function CreditRequests() {
  const dispatch = useDispatch()
  const selectedRequest = useSelector((state: RootState) => state.requests.selectedRequest)
  const notificationOpened = useSelector((state: RootState) => state.notifications.notificationOpened)

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending'
  })
  const [filterValue, setFilterValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('all')

  //Si hay algun filtro activado
  const hasFilters = useMemo(() => {
    return filterValue || statusFilter !== 'all' || typeFilter !== 'all' || clientTypeFilter !== 'all'
  }, [filterValue, statusFilter, typeFilter, clientTypeFilter])

  const r2Api = import.meta.env.VITE_R2SERVICE_URL

  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  // const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure()

  const isMobile = useIsMobile()

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

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return

    try {
      //Primero se eliminan los documentos de la solicitud, se seleccionan de la base para eliminarse
      const { data } = await supabase.from('documentos').select().eq('solicitud_id', selectedRequest.id)

      data?.forEach(async (doc: any) => {
        //Eliminar documento de r2 usando la api de r2
        const response = await fetch(`${r2Api}/api/files/${doc.url}`, {
          method: 'DELETE'
        })

        //console.log(response)
      })

      const { error } = await supabase.from('solicitudes').delete().eq('id', selectedRequest.id)

      if (error) throw error
      onDeleteClose()
      dispatch(clearSelectedRequest())
    } catch (error) {
      console.error('Error deleting request:', error)
    }
  }

  const handleViewRequest = (request: any) => {
    dispatch(setSelectedRequest(request))
    onViewOpen()
  }

  const handleCancelRequest = async () => {
    if (!selectedRequest) return

    console.log('Canceling request:', selectedRequest)

    try {
      const { error } = await supabase.from('solicitudes').update({ status: 'cancelada' }).eq('id', selectedRequest.id)

      if (error) throw error
      onCancelClose()
      dispatch(clearSelectedRequest())
    } catch (error) {
      console.error('Error canceling request:', error)
    }
  }

  const handleResetFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
    setClientTypeFilter('all')
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

  useEffect(() => {
    if (!selectedRequest) return

    if (notificationOpened) {
      handleViewRequest(selectedRequest)
    }

    console.log('Cambio de modal', selectedRequest)
  }, [selectedRequest])

  return (
    <div className='space-y-4 '>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Solicitudes de crédito</h2>
      </div>

      <Card>
        <CardBody>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col sm:flex-row gap-4 justify-between'>
              <div className='flex flex-grow sm:flex-wrap gap-2 sm:gap-3'>
                <Input
                  isClearable
                  className='sm:flex-1 sm:max-w-xs '
                  placeholder='Buscar por nombre o email...'
                  startContent={<Search className='text-default-300' size={18} />}
                  value={filterValue}
                  onClear={() => setFilterValue('')}
                  onChange={(e) => setFilterValue(e.target.value)}
                />

                <Popover placement='bottom'>
                  <PopoverTrigger className='sm:hidden'>
                    <Button isIconOnly color='primary' variant='ghost'>
                      <Filter />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className='flex flex-col gap-2 py-2'>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant='flat' startContent={<Filter size={18} />} endContent={<ChevronDown size={18} />}>
                            {clientTypeFilter === 'all'
                              ? 'Tipo de cliente'
                              : clientTypeFilter.charAt(0).toUpperCase() + clientTypeFilter.slice(1)}
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
                          <DropdownItem key='business'>Empresarial</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant='flat' startContent={<Filter size={18} />} endContent={<ChevronDown size={18} />}>
                            {typeFilter === 'all' ? 'Tipo de crédito' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
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
                            {statusFilter === 'all'
                              ? 'Status'
                              : (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)).replace('_', ' ')}
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
                          <DropdownItem key='en_revision'>En Revisión</DropdownItem>
                          <DropdownItem key='documentacion'>Documentacion</DropdownItem>
                          <DropdownItem key='completada'>Completada</DropdownItem>
                          <DropdownItem key='rechazada'>Rechazada</DropdownItem>
                          <DropdownItem key='cancelada'>Cancelada</DropdownItem>
                          <DropdownItem key='aprobada'>Aprobada</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </PopoverContent>
                </Popover>

                {hasFilters && (
                  <Button
                    isIconOnly
                    variant='ghost'
                    color='danger'
                    startContent={<FilterX size={20} />}
                    onPress={handleResetFilters}
                    className='sm:hidden'
                  ></Button>
                )}

                <div className=' gap-3 hidden sm:flex'>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant='flat' startContent={<Filter size={18} />} endContent={<ChevronDown size={18} />}>
                        {clientTypeFilter === 'all' ? 'Tipo de cliente' : clientTypeFilter === 'Personal' ? 'Personal' : 'Empresarial'}
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
                      <DropdownItem key='business'>Empresarial</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant='flat' startContent={<Filter size={18} />} endContent={<ChevronDown size={18} />}>
                        {typeFilter === 'all' ? 'Tipo de crédito' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
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
                        {statusFilter === 'all'
                          ? 'Status'
                          : (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)).replace('_', ' ')}
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
                      <DropdownItem key='en_revision'>En Revisión</DropdownItem>
                      <DropdownItem key='documentacion'>Documentacion</DropdownItem>
                      <DropdownItem key='completada'>Completada</DropdownItem>
                      <DropdownItem key='rechazada'>Rechazada</DropdownItem>
                      <DropdownItem key='cancelada'>Cancelada</DropdownItem>
                      <DropdownItem key='aprobada'>Aprobada</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                  {hasFilters && (
                    <Button
                      isIconOnly
                      variant='ghost'
                      color='danger'
                      startContent={<FilterX size={20} />}
                      onPress={handleResetFilters}
                    ></Button>
                  )}
                </div>
              </div>
              <div className='hidden sm:flex'>
                <Button color='primary' startContent={<Plus size={18} />} onPress={onCreateOpen}>
                  Nueva Solicitud
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

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
          wrapper: `max-h-[calc(100vh-17rem)] `
        }}
        isStriped={isMobile}
      >
        <TableHeader>
          <TableColumn key='nombre' allowsSorting>
            Nombre
          </TableColumn>
          <TableColumn key='tipo_cliente' allowsSorting className='hidden sm:table-cell'>
            Tipo de cliente
          </TableColumn>
          <TableColumn key='tipo_credito' allowsSorting className='hidden sm:table-cell'>
            Tipo de Crédito
          </TableColumn>
          <TableColumn key='monto' allowsSorting className='hidden sm:table-cell'>
            Monto
          </TableColumn>
          <TableColumn key='status' allowsSorting className='hidden sm:table-cell'>
            Status
          </TableColumn>
          <TableColumn key='updated_at' allowsSorting className='hidden sm:table-cell'>
            Última actividad
          </TableColumn>
          <TableColumn>
            <LayoutList />
          </TableColumn>
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
              <TableCell>
                <span className='text-lg sm:text-small'>{request.nombre}</span>
                <div className='flex flex-col gap-3 sm:hidden pt-2'>
                  <div className='flex items-center gap-2 justify-between'>
                    {(() => {
                      const statusConfig = getRequestStatusConfig(request.status) // Obtiene la config del estado
                      const Icon = statusConfig.icon // Extrae el icono

                      return (
                        <Chip size='sm' startContent={<Icon className='ml-1' size={20} />} variant='flat' color={statusConfig.color}>
                          {statusConfig.text}
                        </Chip>
                      )
                    })()}

                    <span className='font-semibold'>${request.monto.toLocaleString('es-MX')}</span>
                  </div>
                  <div className='flex gap-2'>
                    <Chip variant='flat' color='secondary'>
                      {request.tipo_credito.charAt(0).toUpperCase() + request.tipo_credito.slice(1)}
                    </Chip>
                    <Chip variant='flat' color='primary'>
                      {request.tipo_cliente === 'personal' ? 'Personal' : 'Empresarial'}
                    </Chip>
                  </div>
                </div>
              </TableCell>
              <TableCell className='hidden sm:table-cell'>
                <Chip variant='flat' color='primary'>
                  {request.tipo_cliente === 'personal' ? 'Personal' : 'Empresarial'}
                </Chip>
              </TableCell>
              <TableCell className='hidden sm:table-cell'>
                <Chip variant='flat' color='secondary'>
                  {request.tipo_credito.charAt(0).toUpperCase() + request.tipo_credito.slice(1)}
                </Chip>
              </TableCell>
              <TableCell className='hidden sm:table-cell'>${request.monto.toLocaleString('es-MX')}</TableCell>

              <TableCell className='hidden sm:table-cell'>
                {(() => {
                  const statusConfig = getRequestStatusConfig(request.status) // Obtiene la config del estado
                  const Icon = statusConfig.icon // Extrae el icono

                  return (
                    <Chip startContent={<Icon className='ml-1' size={20} />} variant='flat' color={statusConfig.color}>
                      {statusConfig.text}
                    </Chip>
                  )
                })()}
              </TableCell>
              <TableCell className='hidden sm:table-cell'>
                {format(new Date(request.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </TableCell>
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
                          dispatch(setSelectedRequest(request))

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
                        startContent={<CircleX size={18} />}
                        onPress={() => {
                          dispatch(setSelectedRequest(request))
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

      <div className='md:hidden flex fixed bottom-3 right-4'>
        <Button color='primary' startContent={<Plus strokeWidth={2} />} onPress={onCreateOpen}>
          Nueva Solicitud
        </Button>
      </div>

      {/* Modales */}
      <ViewRequestModal isOpen={isViewOpen} onClose={onViewClose} request={selectedRequest} />

      <CreateRequestModal isOpen={isCreateOpen} onClose={onCreateClose} />

      <DeleteRequestModal isOpen={isDeleteOpen} onClose={onDeleteClose} onDelete={handleDeleteRequest} />

      <CancelRequestModal isOpen={isCancelOpen} onClose={onCancelClose} onCancel={handleCancelRequest} />

      {/* <Button color='primary' className='fixed bottom-7' startContent={<Plus size={18} />} onPress={onDrawerOpen}>
        Show Drawer
      </Button> */}
    </div>
  )
}
