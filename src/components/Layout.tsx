import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent
} from '@nextui-org/react'
import { CreditCard, LayoutDashboard, LogOut, Moon, Settings, Sun, UserCircle, Users } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/branding/logo.svg'
import { signOut } from '../lib/supabase'
import { useTheme } from '../providers/ThemeProvider'
import { RootState } from '../store'
import { logout } from '../store/slices/authSlice'
import NotificationManager from './NotificationManager'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Solicitudes', path: '/solicitudes', icon: CreditCard },
    // { name: 'Trámites', path: '/tramites', icon: FileText },
    // { name: 'Portafolio', path: '/portafolio', icon: Briefcase },
    ...(user?.role === 'admin' ? [{ name: 'Usuarios', path: '/usuarios', icon: Users }] : [])
  ]

  const handleLogout = async () => {
    try {
      await signOut()
      dispatch(logout())
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex'>
      {/* Sidebar - Ahora con posición fija */}
      <div className='fixed top-0 left-0 h-screen w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 z-40'>
        {/* Logo */}
        <div
          className='h-16 flex  items-center px-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer'
          onClick={() => navigate('/')}
        >
          <img src={logo} alt='Logo' className='w-12 md:w-10' />
          <div className='flex flex-col gap-0'>
            <p className='ml-2 font-bold blueFinancial font-montserrat'>Grupo Financial</p>
            <small className='ml-2 font-bold text-primary font-montserrat -mt-2'>Hub de operaciones</small>
          </div>
        </div>

        {/* Navigation */}
        <nav className='p-4 space-y-2 overflow-y-auto h-[calc(100vh-4rem)]'>
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content - Con margen izquierdo para compensar el sidebar fijo */}
      <div className='flex-1 flex flex-col ml-64'>
        <Navbar isBordered maxWidth='full' className='fixed top-0 right-0 z-30 h-16'>
          <NavbarBrand>
            <p className='font-bold text-inherit'>ACME</p>
          </NavbarBrand>
          <NavbarContent justify='end' className='gap-4'>
            <NotificationManager />

            <Button isIconOnly variant='light' onClick={toggleTheme} aria-label='Cambiar tema'>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </Button>

            <Dropdown placement='bottom-end'>
              <DropdownTrigger>
                <Avatar
                  color='primary'
                  isBordered
                  showFallback
                  size='sm'
                  src={`https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}&chars=1`}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label='Acciones de usuario' disabledKeys={['user-data']}>
                <DropdownItem key='user-data' className='h-14 gap-2 opacity-100'>
                  <p className='font-semibold'>Signed in as</p>
                  <p className='font-semibold'>{user?.role}</p>
                  <p className='font-semibold'>{user?.name}</p>
                </DropdownItem>
                <DropdownItem key='profile' startContent={<UserCircle size={18} />}>
                  Mi Perfil
                </DropdownItem>
                <DropdownItem key='settings' startContent={<Settings size={18} />}>
                  Configuración
                </DropdownItem>
                <DropdownItem
                  key='logout'
                  className='text-danger'
                  color='danger'
                  startContent={<LogOut size={18} />}
                  onPress={handleLogout}
                >
                  Cerrar sesión
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>
        </Navbar>

        <main className='flex-1 p-8 mt-16 overflow-auto'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
