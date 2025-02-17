import { Card, CardBody } from '@nextui-org/react';
import {
  CreditCard,
  FileText,
  Briefcase,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      name: 'Solicitudes Pendientes',
      value: '12',
      icon: CreditCard,
      change: '+2.5%',
      changeType: 'increase',
    },
    {
      name: 'Trámites en Proceso',
      value: '8',
      icon: FileText,
      change: '-0.5%',
      changeType: 'decrease',
    },
    {
      name: 'Créditos Activos',
      value: '45',
      icon: Briefcase,
      change: '+4.75%',
      changeType: 'increase',
    },
    {
      name: 'Comisiones del Mes',
      value: '$15,200',
      icon: TrendingUp,
      change: '+12.5%',
      changeType: 'increase',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Panel de Control</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <stat.icon className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-default-500">{stat.name}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <span
                      className={`text-xs ${
                        stat.changeType === 'increase'
                          ? 'text-success'
                          : 'text-danger'
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">
              Actividad Reciente
            </h3>
            {/* Aquí irá el componente de actividad reciente */}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">
              Próximos Vencimientos
            </h3>
            {/* Aquí irá el componente de próximos vencimientos */}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}