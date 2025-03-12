import { Card, CardBody, Chip, Select, SelectItem, Spinner } from '@nextui-org/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Briefcase,
  CircleAlert,
  CreditCard,
  DollarSign,
  FileCheck2,
  FileLock2,
  FileMinus,
  FilePlus,
  FilePlus2,
  FileSearch,
  Info,
  ListChecks,
  SmilePlus,
  TrendingUp,
  UserRoundPlus
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useRealtime } from '../hooks/useRealTime'
import { supabase } from '../lib/supabase'
import { formatCurrencyCNN } from '../lib/utils'

// Map of notification icons
const iconMap = {
  AlertTriangle: CircleAlert,
  FileCheck2: FileCheck2,
  FileLock2: FileLock2,
  FileMinus: FileMinus,
  FilePlus: FilePlus,
  FilePlus2: FilePlus2,
  FileSearch: FileSearch,
  Info: Info,
  ListChecks: ListChecks,
  SmilePlus: SmilePlus,
  UserRoundPlus: UserRoundPlus
} as const

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

type ChartView = 'status' | 'clientType' | 'creditType'

export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [chartView, setChartView] = useState<ChartView>('creditType')
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    totalPendingAmount: 0
  })

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('solicitudes').select('*')

      if (error) throw error
      setRequests(data || [])

      // Calculate stats
      const pendingRequests = data?.filter((req) => ['nueva', 'en_revision', 'documentacion'].includes(req.status)).length || 0
      const totalRequests = data?.length || 0

      const totalPendingAmount =
        data?.reduce((acc, req) => (['nueva', 'en_revision', 'documentacion'].includes(req.status) ? acc + req.monto : acc), 0) || 0

      setStats({
        pendingRequests,
        totalPendingAmount,
        totalRequests
      })
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }, [])

  const fetchRecentActivity = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications_summary_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentActivity(data || [])
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Subscribe to realtime changes
  useRealtime('notifications', fetchRecentActivity)
  useRealtime('solicitudes', fetchRequests)

  useEffect(() => {
    fetchRecentActivity()
    fetchRequests()
  }, [fetchRecentActivity, fetchRequests])

  const chartData = useMemo(() => {
    if (!requests.length) return []

    switch (chartView) {
      case 'status':
        return Object.entries(
          requests.reduce((acc, req) => {
            acc[req.status] = (acc[req.status] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }))

      case 'clientType':
        return Object.entries(
          requests.reduce((acc, req) => {
            const type = req.tipo_cliente === 'personal' ? 'Personal' : 'Empresarial'
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }))

      case 'creditType':
        return Object.entries(
          requests.reduce((acc, req) => {
            const type = req.tipo_credito.charAt(0).toUpperCase() + req.tipo_credito.slice(1)
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }))

      default:
        return []
    }
  }, [requests, chartView])

  const dashboardStats = [
    {
      name: 'Solicitudes registradas',
      value: stats.totalRequests.toString(),
      icon: Briefcase,
      change: '+4.75%',
      changeType: 'increase'
    },
    {
      name: 'Solicitudes en proceso',
      value: stats.pendingRequests.toString(),
      icon: CreditCard,
      change: '+2.5%',
      changeType: 'increase'
    },

    {
      name: 'Total en Solicitudes',
      value: `$${formatCurrencyCNN(stats.totalPendingAmount)}`,
      icon: DollarSign,
      change: '+3.2%',
      changeType: 'increase'
    },
    {
      name: 'Comisiones previstas',
      value: `$${formatCurrencyCNN(stats.totalPendingAmount * 0.04)}`,
      icon: TrendingUp,
      change: '+12.5%',
      changeType: 'increase'
    }
  ]

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold mb-4'>Panel de Control</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {dashboardStats.map((stat) => (
            <Card key={stat.name}>
              <CardBody className='flex flex-row items-center gap-4'>
                <div className='p-3 rounded-lg bg-primary/10'>
                  <stat.icon className='text-primary' size={24} />
                </div>
                <div>
                  <p className='text-sm text-default-500'>{stat.name}</p>
                  <div className='flex items-baseline gap-2'>
                    <p className='text-2xl font-semibold'>{stat.value}</p>
                    <span className={`text-xs ${stat.changeType === 'increase' ? 'text-success' : 'text-danger'}`}>{stat.change}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardBody className='max-h-96'>
            <h3 className='text-lg font-semibold mb-4'>Actividad Reciente</h3>

            <PerfectScrollbar options={{ suppressScrollX: true }} className='max-h-80 overflow-x-hidden'>
              {loading ? (
                <div className='flex justify-center py-8'>
                  <Spinner color='primary' />
                </div>
              ) : recentActivity.length > 0 ? (
                <div className='space-y-4'>
                  {recentActivity.map((activity, index) => {
                    const IconComponent = iconMap[activity.icon as keyof typeof iconMap] || Info

                    return (
                      <div className='flex items-start gap-2 p-2 rounded-lg hover:bg-default-100 transition-colors' key={index}>
                        <div className={`p-2 rounded-lg bg-${activity.color}/10`}>
                          <IconComponent className={`text-${activity.color}`} size={20} />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-default-900'>{activity.title}</p>
                          <p className='text-default-500'>
                            De {activity.request_data.nombre} por ${formatCurrencyCNN(activity.request_data.monto)}
                          </p>
                          <div className='flex items-center gap-2 mt-1'>
                            {activity.managed_by_name ? (
                              <Chip size='sm' variant='flat' color='primary'>
                                {activity.managed_by_name}
                              </Chip>
                            ) : (
                              activity.title === 'Nueva Solicitud' && (
                                <Chip size='sm' variant='flat' color='secondary'>
                                  Desde el sitio web
                                </Chip>
                              )
                            )}
                            <span className='text-tiny text-default-400'>
                              {format(new Date(activity.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='text-center py-8 text-default-400'>No hay actividad reciente</div>
              )}
            </PerfectScrollbar>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-lg font-semibold'>Distribución de Solicitudes</h3>
              <Select
                size='sm'
                value={chartView}
                onChange={(e) => setChartView(e.target.value as ChartView)}
                defaultSelectedKeys={['creditType']}
                className='max-w-52'
              >
                <SelectItem key='status' value='status'>
                  Por status
                </SelectItem>
                <SelectItem key='clientType' value='clientType'>
                  Por tipo de cliente
                </SelectItem>
                <SelectItem key='creditType' value='creditType'>
                  Por tipo de crédito
                </SelectItem>
              </Select>
            </div>

            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
