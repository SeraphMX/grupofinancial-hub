import { useState, useMemo } from 'react';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@nextui-org/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Search,
  Filter,
  MoreVertical,
  FileText,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

type ProcessStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'processing';

interface Process {
  id: string;
  requestId: string;
  type: 'personal' | 'business';
  applicantName: string;
  amount: number;
  status: ProcessStatus;
  progress: number;
  assignedTo: string;
  updatedAt: string;
  documents: {
    required: number;
    uploaded: number;
  };
}

const mockProcesses: Process[] = [
  {
    id: '1',
    requestId: '1',
    type: 'personal',
    applicantName: 'Juan Pérez',
    amount: 15000,
    status: 'in_review',
    progress: 65,
    assignedTo: '2',
    updatedAt: '2024-03-01T10:30:00.000Z',
    documents: {
      required: 5,
      uploaded: 3,
    },
  },
  {
    id: '2',
    requestId: '2',
    type: 'business',
    applicantName: 'Empresa Ejemplo S.A.',
    amount: 100000,
    status: 'processing',
    progress: 85,
    assignedTo: '2',
    updatedAt: '2024-03-01T14:45:00.000Z',
    documents: {
      required: 8,
      uploaded: 7,
    },
  },
];

const statusColorMap: Record<ProcessStatus, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  pending: "default",
  in_review: "primary",
  approved: "success",
  rejected: "danger",
  processing: "secondary",
};

const statusIconMap: Record<ProcessStatus, React.ReactNode> = {
  pending: <Clock size={16} />,
  in_review: <FileText size={16} />,
  approved: <CheckCircle2 size={16} />,
  rejected: <XCircle size={16} />,
  processing: <AlertCircle size={16} />,
};

const statusTextMap: Record<ProcessStatus, string> = {
  pending: "Pendiente",
  in_review: "En Revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  processing: "En Proceso",
};

export default function ProcessManagement() {
  const [filterValue, setFilterValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ProcessStatus | "all">("all");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  const filteredProcesses = useMemo(() => {
    let filtered = [...mockProcesses];

    if (filterValue) {
      filtered = filtered.filter((process) =>
        process.applicantName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((process) => process.status === selectedStatus);
    }

    return filtered;
  }, [filterValue, selectedStatus]);

  const handleProcessClick = (process: Process) => {
    setSelectedProcess(process);
    onOpen();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Trámites</h2>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
              <div className="flex-1 flex gap-3">
                <Input
                  isClearable
                  className="w-full sm:max-w-[44%]"
                  placeholder="Buscar por nombre..."
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
                    >
                      Estado
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    disallowEmptySelection
                    aria-label="Filtrar por estado"
                    selectedKeys={[selectedStatus]}
                    selectionMode="single"
                    onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] as ProcessStatus | "all")}
                  >
                    <DropdownItem key="all">Todos</DropdownItem>
                    <DropdownItem key="pending">Pendiente</DropdownItem>
                    <DropdownItem key="in_review">En Revisión</DropdownItem>
                    <DropdownItem key="processing">En Proceso</DropdownItem>
                    <DropdownItem key="approved">Aprobado</DropdownItem>
                    <DropdownItem key="rejected">Rechazado</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            <Table aria-label="Tabla de trámites">
              <TableHeader>
                <TableColumn>SOLICITANTE</TableColumn>
                <TableColumn>TIPO</TableColumn>
                <TableColumn>MONTO</TableColumn>
                <TableColumn>ESTADO</TableColumn>
                <TableColumn>PROGRESO</TableColumn>
                <TableColumn>DOCUMENTOS</TableColumn>
                <TableColumn>ACTUALIZACIÓN</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredProcesses.map((process) => (
                  <TableRow key={process.id} className="cursor-pointer" onClick={() => handleProcessClick(process)}>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="text-bold">{process.applicantName}</p>
                        <p className="text-tiny text-default-500">ID: {process.requestId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant="flat"
                        color={process.type === 'personal' ? 'primary' : 'secondary'}
                      >
                        {process.type === 'personal' ? 'Personal' : 'Empresarial'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      ${process.amount.toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        startContent={statusIconMap[process.status]}
                        variant="flat"
                        color={statusColorMap[process.status]}
                      >
                        {statusTextMap[process.status]}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Progress
                          size="sm"
                          value={process.progress}
                          color="primary"
                          className="max-w-md"
                        />
                        <span className="text-small text-default-500">
                          {process.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-bold">
                          {process.documents.uploaded}/{process.documents.required}
                        </span>
                        <span className="text-tiny text-default-500">
                          documentos
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-small text-default-500">
                        {format(new Date(process.updatedAt), "d 'de' MMMM, HH:mm", { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVertical size={20} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              startContent={<FileText size={18} />}
                            >
                              Ver detalles
                            </DropdownItem>
                            <DropdownItem
                              startContent={<MessageCircle size={18} />}
                            >
                              Agregar comunicación
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <Modal
        size="2xl"
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Detalles del Trámite
              </ModalHeader>
              <ModalBody>
                {selectedProcess && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-small font-medium text-default-500">Solicitante</h3>
                        <p className="text-medium">{selectedProcess.applicantName}</p>
                      </div>
                      <div>
                        <h3 className="text-small font-medium text-default-500">Tipo de Crédito</h3>
                        <Chip
                          variant="flat"
                          color={selectedProcess.type === 'personal' ? 'primary' : 'secondary'}
                        >
                          {selectedProcess.type === 'personal' ? 'Personal' : 'Empresarial'}
                        </Chip>
                      </div>
                      <div>
                        <h3 className="text-small font-medium text-default-500">Monto</h3>
                        <p className="text-medium">${selectedProcess.amount.toLocaleString('es-ES')}</p>
                      </div>
                      <div>
                        <h3 className="text-small font-medium text-default-500">Estado</h3>
                        <Chip
                          startContent={statusIconMap[selectedProcess.status]}
                          variant="flat"
                          color={statusColorMap[selectedProcess.status]}
                        >
                          {statusTextMap[selectedProcess.status]}
                        </Chip>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-small font-medium text-default-500 mb-2">Progreso del Trámite</h3>
                      <Progress
                        size="md"
                        value={selectedProcess.progress}
                        color="primary"
                        showValueLabel
                        className="max-w-md"
                      />
                    </div>

                    <div>
                      <h3 className="text-small font-medium text-default-500 mb-2">Documentación</h3>
                      <Card>
                        <CardBody>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-medium">Documentos Requeridos: {selectedProcess.documents.required}</p>
                              <p className="text-small text-default-500">
                                {selectedProcess.documents.uploaded} documentos subidos
                              </p>
                            </div>
                            <Button color="primary" variant="flat">
                              Ver Documentos
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                <Button color="primary" onPress={onClose}>
                  Actualizar Estado
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}