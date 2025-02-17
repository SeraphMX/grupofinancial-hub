import { useMemo } from 'react';
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
  Tabs,
  Tab,
} from '@nextui-org/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { BadgePercent, TrendingUp, Users } from 'lucide-react';

interface Commission {
  id: string;
  creditId: string;
  agentId: string;
  agentName: string;
  amount: number;
  percentage: number;
  date: string;
  creditAmount: number;
  creditType: 'personal' | 'business';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const mockCommissions: Commission[] = [
  {
    id: '1',
    creditId: '1',
    agentId: '2',
    agentName: 'Agente Ejemplo',
    amount: 750,
    percentage: 5,
    date: '2024-03-01T00:00:00.000Z',
    creditAmount: 15000,
    creditType: 'personal',
  },
  {
    id: '2',
    creditId: '2',
    agentId: '2',
    agentName: 'Agente Ejemplo',
    amount: 5000,
    percentage: 5,
    date: '2024-02-15T00:00:00.000Z',
    creditAmount: 100000,
    creditType: 'business',
  },
  // Datos adicionales para los gráficos
  {
    id: '3',
    creditId: '3',
    agentId: '3',
    agentName: 'María González',
    amount: 1200,
    percentage: 4,
    date: '2024-02-01T00:00:00.000Z',
    creditAmount: 30000,
    creditType: 'personal',
  },
  {
    id: '4',
    creditId: '4',
    agentId: '4',
    agentName: 'Carlos Rodríguez',
    amount: 3000,
    percentage: 5,
    date: '2024-01-15T00:00:00.000Z',
    creditAmount: 60000,
    creditType: 'business',
  },
];

const generateMonthlyData = () => {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      month: format(date, 'MMM', { locale: es }),
      personal: Math.floor(Math.random() * 10000) + 2000,
      business: Math.floor(Math.random() * 15000) + 5000,
    };
  }).reverse();

  return months;
};

const generateAgentPerformance = () => {
  const agents = ['Agente Ejemplo', 'María González', 'Carlos Rodríguez', 'Ana Martínez'];
  return agents.map(agent => ({
    name: agent,
    comisiones: Math.floor(Math.random() * 15000) + 5000,
    creditos: Math.floor(Math.random() * 10) + 5,
  }));
};

export default function CommissionsPanel() {
  const monthlyData = useMemo(() => generateMonthlyData(), []);
  const agentPerformance = useMemo(() => generateAgentPerformance(), []);

  const pieData = useMemo(() => {
    const typeData = mockCommissions.reduce((acc, curr) => {
      const type = curr.creditType === 'personal' ? 'Personal' : 'Empresarial';
      acc[type] = (acc[type] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeData).map(([name, value]) => ({
      name,
      value,
    }));
  }, []);

  return (
    <div className="space-y-6">
      <Tabs aria-label="Opciones">
        <Tab
          key="overview"
          title={
            <div className="flex items-center gap-2">
              <TrendingUp size={18} />
              <span>Resumen</span>
            </div>
          }
        >
          <div className="pt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-4">Comisiones Mensuales</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="personal" name="Personal" fill="#0088FE" />
                        <Bar dataKey="business" name="Empresarial" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-4">Distribución por Tipo</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">Rendimiento por Agente</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={agentPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="comisiones"
                        name="Comisiones ($)"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="creditos"
                        name="Créditos (#)"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab
          key="details"
          title={
            <div className="flex items-center gap-2">
              <BadgePercent size={18} />
              <span>Detalle de Comisiones</span>
            </div>
          }
        >
          <div className="pt-4">
            <Card>
              <CardBody>
                <Table aria-label="Tabla de comisiones">
                  <TableHeader>
                    <TableColumn>AGENTE</TableColumn>
                    <TableColumn>TIPO</TableColumn>
                    <TableColumn>MONTO CRÉDITO</TableColumn>
                    <TableColumn>COMISIÓN</TableColumn>
                    <TableColumn>PORCENTAJE</TableColumn>
                    <TableColumn>FECHA</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {mockCommissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-default-400" />
                            {commission.agentName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant="flat"
                            color={commission.creditType === 'personal' ? 'primary' : 'secondary'}
                          >
                            {commission.creditType === 'personal' ? 'Personal' : 'Empresarial'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          ${commission.creditAmount.toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-success">
                            ${commission.amount.toLocaleString('es-ES')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip variant="flat" color="warning">
                            {commission.percentage}%
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {format(new Date(commission.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab
          key="agents"
          title={
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>Agentes</span>
            </div>
          }
        >
          <div className="pt-4">
            <Card>
              <CardBody>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="comisiones" name="Comisiones" fill="#8884d8" />
                      <Bar dataKey="creditos" name="Créditos" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}