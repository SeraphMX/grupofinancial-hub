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
  Tabs,
  Tab,
} from '@nextui-org/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  Calendar,
  DollarSign,
  BadgePercent,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import CommissionsPanel from '../components/CommissionsPanel';

interface Credit {
  id: string;
  requestId: string;
  applicantName: string;
  type: 'personal' | 'business';
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  status: 'active' | 'completed' | 'defaulted';
  nextPaymentDate: string;
  progress: number;
}

const mockCredits: Credit[] = [
  {
    id: '1',
    requestId: '1',
    applicantName: 'Juan Pérez',
    type: 'personal',
    amount: 15000,
    term: 24,
    interestRate: 12.5,
    monthlyPayment: 705.25,
    status: 'active',
    nextPaymentDate: '2024-04-01T00:00:00.000Z',
    progress: 25,
  },
  {
    id: '2',
    requestId: '2',
    applicantName: 'Empresa Ejemplo S.A.',
    type: 'business',
    amount: 100000,
    term: 36,
    interestRate: 10.5,
    monthlyPayment: 3250.75,
    status: 'active',
    nextPaymentDate: '2024-04-15T00:00:00.000Z',
    progress: 15,
  },
];

const statusColorMap = {
  active: 'success',
  completed: 'primary',
  defaulted: 'danger',
} as const;

const statusTextMap = {
  active: 'Activo',
  completed: 'Completado',
  defaulted: 'En mora',
} as const;

export default function CreditPortfolio() {
  const [selectedTab, setSelectedTab] = useState('portfolio');
  const [filterValue, setFilterValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCredits = useMemo(() => {
    let filtered = [...mockCredits];

    if (filterValue) {
      filtered = filtered.filter((credit) =>
        credit.applicantName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((credit) => credit.status === statusFilter);
    }

    return filtered;
  }, [filterValue, statusFilter]);

  const stats = [
    {
      title: 'Cartera Total',
      value: '$1,250,000',
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'increase' as const,
    },
    {
      title: 'Créditos Activos',
      value: '45',
      icon: TrendingUp,
      change: '+4.75%',
      changeType: 'increase' as const,
    },
    {
      title: 'Tasa Promedio',
      value: '11.5%',
      icon: BadgePercent,
      change: '-0.5%',
      changeType: 'decrease' as const,
    },
    {
      title: 'Próximos Vencimientos',
      value: '8',
      icon: Calendar,
      change: '+2',
      changeType: 'increase' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portafolio de Créditos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardBody>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <p className="text-sm text-default-500">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <span
                      className={`text-xs flex items-center gap-1 ${
                        stat.changeType === 'increase'
                          ? 'text-success'
                          : 'text-danger'
                      }`}
                    >
                      {stat.changeType === 'increase' ? (
                        <ArrowUpRight size={12} />
                      ) : (
                        <ArrowDownRight size={12} />
                      )}
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="text-primary" size={20} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
          >
            <Tab
              key="portfolio"
              title={
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={18} />
                  <span>Portafolio</span>
                </div>
              }
            >
              <div className="pt-4 flex flex-col gap-4">
                <div className="flex justify-between gap-3">
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
                      selectedKeys={[statusFilter]}
                      selectionMode="single"
                      onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
                    >
                      <DropdownItem key="all">Todos</DropdownItem>
                      <DropdownItem key="active">Activos</DropdownItem>
                      <DropdownItem key="completed">Completados</DropdownItem>
                      <DropdownItem key="defaulted">En mora</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>

                <Table aria-label="Tabla de créditos">
                  <TableHeader>
                    <TableColumn>CLIENTE</TableColumn>
                    <TableColumn>TIPO</TableColumn>
                    <TableColumn>MONTO</TableColumn>
                    <TableColumn>CUOTA</TableColumn>
                    <TableColumn>PROGRESO</TableColumn>
                    <TableColumn>ESTADO</TableColumn>
                    <TableColumn>PRÓXIMO PAGO</TableColumn>
                    <TableColumn>ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {filteredCredits.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <p className="text-bold">{credit.applicantName}</p>
                            <p className="text-tiny text-default-500">ID: {credit.requestId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant="flat"
                            color={credit.type === 'personal' ? 'primary' : 'secondary'}
                          >
                            {credit.type === 'personal' ? 'Personal' : 'Empresarial'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          ${credit.amount.toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>
                          ${credit.monthlyPayment.toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Progress
                              size="sm"
                              value={credit.progress}
                              color="primary"
                              className="max-w-md"
                            />
                            <span className="text-small text-default-500">
                              {credit.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant="flat"
                            color={statusColorMap[credit.status]}
                          >
                            {statusTextMap[credit.status]}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {format(new Date(credit.nextPaymentDate), "d 'de' MMMM", { locale: es })}
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
                                <DropdownItem>Ver detalles</DropdownItem>
                                <DropdownItem>Registrar pago</DropdownItem>
                                <DropdownItem>Estado de cuenta</DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>
            <Tab
              key="commissions"
              title={
                <div className="flex items-center gap-2">
                  <BadgePercent size={18} />
                  <span>Comisiones</span>
                </div>
              }
            >
              <div className="pt-4">
                <CommissionsPanel />
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}