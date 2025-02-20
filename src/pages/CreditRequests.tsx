import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
  Button,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure,
  Selection,
  SortDescriptor,
} from '@nextui-org/react';
import { Search, Plus, MoreVertical, Eye, Edit, Trash, Filter, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import ViewRequestModal from '../components/modals/ViewRequestModal';
import CreateRequestModal from '../components/modals/CreateRequestModal';
import EditRequestModal from '../components/modals/EditRequestModal';
import DeleteRequestModal from '../components/modals/DeleteRequestModal';

const statusColorMap: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  pendiente: "default",
  en_revision: "primary",
  aprobada: "success",
  rechazada: "danger",
  cancelada: "warning",
};

export default function CreditRequests() {
  const navigate = useNavigate();
  const [filterValue, setFilterValue] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending',
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('all');

  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      channel = supabase
        .channel('solicitudes_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'solicitudes',
          },
          async () => {
            await fetchRequests();
          }
        )
        .subscribe();
    };

    fetchRequests();
    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (data: any) => {
    try {
      const { error } = await supabase
        .from('solicitudes')
        .insert([{
          ...data,
          status: 'pendiente',
        }]);

      if (error) throw error;
      onCreateClose();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const handleUpdateRequest = async (data: any) => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('solicitudes')
        .update(data)
        .eq('id', selectedRequest.id);

      if (error) throw error;
      onEditClose();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('solicitudes')
        .delete()
        .eq('id', selectedRequest.id);

      if (error) throw error;
      onDeleteClose();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    onViewOpen();
  };

  const handleEditRequest = (request: any) => {
    setSelectedRequest(request);
    onEditOpen();
  };

  const handleGenerateRepository = (request: any) => {
    navigate(`/repositorio/${request.id}`);
  };

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (filterValue) {
      filtered = filtered.filter((request) =>
        request.nombre.toLowerCase().includes(filterValue.toLowerCase()) ||
        request.email?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((request) => request.tipo_credito === typeFilter);
    }

    if (clientTypeFilter !== 'all') {
      filtered = filtered.filter((request) => request.tipo_cliente === clientTypeFilter);
    }

    return filtered.sort((a, b) => {
      const { column, direction } = sortDescriptor;
      let first = a[column as keyof typeof a];
      let second = b[column as keyof typeof b];

      if (column === 'monto' || column === 'plazo') {
        first = Number(first);
        second = Number(second);
      }

      if (column === 'created_at' || column === 'updated_at') {
        first = new Date(first).getTime();
        second = new Date(second).getTime();
      }

      let cmp = first < second ? -1 : first > second ? 1 : 0;
      return direction === 'descending' ? -cmp : cmp;
    });
  }, [requests, filterValue, statusFilter, typeFilter, clientTypeFilter, sortDescriptor]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Solicitudes de Crédito</h2>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={onCreateOpen}
        >
          Nueva Solicitud
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 items-end">
              <Input
                isClearable
                className="w-full sm:max-w-[44%]"
                placeholder="Buscar por nombre o email..."
                startContent={<Search className="text-default-300" size={18} />}
                value={filterValue}
                onClear={() => setFilterValue("")}
                onChange={(e) => setFilterValue(e.target.value)}
              />
              
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    startContent={<Filter size={18} />}
                    endContent={<ChevronDown size={18} />}
                  >
                    Estado
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  selectedKeys={[statusFilter]}
                  selectionMode="single"
                  onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
                >
                  <DropdownItem key="all">Todos</DropdownItem>
                  <DropdownItem key="pendiente">Pendiente</DropdownItem>
                  <DropdownItem key="en_revision">En Revisión</DropdownItem>
                  <DropdownItem key="aprobada">Aprobada</DropdownItem>
                  <DropdownItem key="rechazada">Rechazada</DropdownItem>
                  <DropdownItem key="cancelada">Cancelada</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    startContent={<Filter size={18} />}
                    endContent={<ChevronDown size={18} />}
                  >
                    Tipo de Crédito
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  selectedKeys={[typeFilter]}
                  selectionMode="single"
                  onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0] as string)}
                >
                  <DropdownItem key="all">Todos</DropdownItem>
                  <DropdownItem key="personal">Personal</DropdownItem>
                  <DropdownItem key="hipotecario">Hipotecario</DropdownItem>
                  <DropdownItem key="empresarial">Empresarial</DropdownItem>
                  <DropdownItem key="automotriz">Automotriz</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    startContent={<Filter size={18} />}
                    endContent={<ChevronDown size={18} />}
                  >
                    Tipo de Cliente
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  selectedKeys={[clientTypeFilter]}
                  selectionMode="single"
                  onSelectionChange={(keys) => setClientTypeFilter(Array.from(keys)[0] as string)}
                >
                  <DropdownItem key="all">Todos</DropdownItem>
                  <DropdownItem key="personal">Personal</DropdownItem>
                  <DropdownItem key="empresarial">Empresarial</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>

            <Table
              aria-label="Tabla de solicitudes"
              isHeaderSticky
              selectionMode="single"
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
              classNames={{
                wrapper: "max-h-[600px]",
              }}
            >
              <TableHeader>
                <TableColumn key="nombre" allowsSorting>NOMBRE</TableColumn>
                <TableColumn key="tipo_cliente" allowsSorting>TIPO CLIENTE</TableColumn>
                <TableColumn key="tipo_credito" allowsSorting>TIPO CRÉDITO</TableColumn>
                <TableColumn key="monto" allowsSorting>MONTO</TableColumn>
                <TableColumn key="plazo" allowsSorting>PLAZO</TableColumn>
                <TableColumn key="status" allowsSorting>ESTADO</TableColumn>
                <TableColumn key="updated_at" allowsSorting>ACTUALIZADO</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody
                items={filteredRequests}
                isLoading={loading}
                loadingContent={<div>Cargando solicitudes...</div>}
                emptyContent={
                  <div className="py-8 text-center text-default-500">
                    {loading ? "Cargando..." : "No hay solicitudes disponibles"}
                  </div>
                }
              >
                {(request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.nombre}</TableCell>
                    <TableCell>
                      <Chip variant="flat" color="primary">
                        {request.tipo_cliente === 'personal' ? 'Personal' : 'Empresarial'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip variant="flat" color="secondary">
                        {request.tipo_credito.charAt(0).toUpperCase() + request.tipo_credito.slice(1)}
                      </Chip>
                    </TableCell>
                    <TableCell>${request.monto.toLocaleString('es-ES')}</TableCell>
                    <TableCell>{request.plazo} meses</TableCell>
                    <TableCell>
                      <Chip variant="flat" color={statusColorMap[request.status]}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button 
                            isIconOnly
                            size="sm"
                            variant="light"
                          >
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Acciones">
                          <DropdownItem
                            key="view"
                            startContent={<Eye size={18} />}
                            onPress={() => handleViewRequest(request)}
                          >
                            Ver datos
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<Edit size={18} />}
                            onPress={() => handleEditRequest(request)}
                          >
                            Editar solicitud
                          </DropdownItem>
                          <DropdownItem
                            key="repository"
                            startContent={<LinkIcon size={18} />}
                            onPress={() => handleGenerateRepository(request)}
                          >
                            Generar repositorio
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash size={18} />}
                            onPress={() => {
                              setSelectedRequest(request);
                              onDeleteOpen();
                            }}
                          >
                            Eliminar
                          </DropdownItem>
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

      <CreateRequestModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSubmit={handleCreateRequest}
      />

      <EditRequestModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSubmit={handleUpdateRequest}
        request={selectedRequest}
      />

      <DeleteRequestModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onDelete={handleDeleteRequest}
      />
    </div>
  );
}