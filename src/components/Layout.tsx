import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  User
} from '@nextui-org/react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CreditCard, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, UserCircle, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const [isMinimumWidth, setIsMinimumWidth] = useState(false)

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Solicitudes', path: '/solicitudes', icon: CreditCard },
    ...(user?.role === 'admin' ? [{ name: 'Usuarios', path: '/usuarios', icon: Users }] : [])
  ]

  // Función para manejar el colapso del sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
    //localStorage.setItem('sidebarCollapsed', (!isSidebarCollapsed).toString())
  }

  // Efecto para cargar el estado del sidebar desde localStorage
  useEffect(() => {
    const savedState = null //localStorage.getItem('sidebarCollapsed')

    if (savedState !== null) {
      //setIsSidebarCollapsed(savedState === 'true')
    } else {
      // Colapsar automáticamente en resoluciones menores a 1280px

      const handleResize = () => {
        const shouldCollapse = window.innerWidth < 1280

        if (window.innerWidth >= 1280) {
          setIsMinimumWidth(true)
          setIsSidebarCollapsed(false)
        } else {
          setIsMinimumWidth(false)
          setIsSidebarCollapsed(true)
        }

        //setIsSidebarCollapsed(shouldCollapse)
      }

      handleResize() // Ejecutar al inicio
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

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
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row '>
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div
        className={`hidden shadow-xl md:block fixed top-0 left-0 h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 z-40 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className='absolute -right-3 bottom-16 bg-primary text-white rounded-full p-1 shadow-md hover:bg-primary-600 transition-colors z-50'
          aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>

        {/* Logo */}
        <div
          className={`h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}
          onClick={() => navigate('/')}
        >
          <img src={logo} alt='Logo' className='w-10' />
          {!isSidebarCollapsed && (
            <motion.div className='flex flex-col gap-0 ml-2' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className='font-bold blueFinancial font-montserrat'>Grupo Financial</p>
              <small className='font-bold text-primary font-montserrat -mt-2'>Hub de operaciones</small>
            </motion.div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className={`p-4 space-y-2 overflow-y-auto h-[calc(100vh-4rem)] overflow-hidden relative ${isSidebarCollapsed ? 'px-2' : ''}`}>
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={item.name}
            >
              <item.icon size={20} />

              {!isSidebarCollapsed && (
                <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  {item.name}
                </motion.span>
              )}
            </Link>
          ))}
          <div className={`absolute bottom-0 pb-3 ${isSidebarCollapsed ? 'w-full flex justify-center' : ''}`}>
            <Dropdown placement='top-start'>
              <DropdownTrigger>
                <User
                  avatarProps={{
                    src: `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}&chars=1`,
                    isBordered: true,
                    color: 'primary',
                    size: 'sm'
                  }}
                  description={!isSidebarCollapsed ? user?.role : undefined}
                  name={!isSidebarCollapsed ? user?.name : undefined}
                  className='cursor-pointer'
                />
              </DropdownTrigger>
              <DropdownMenu aria-label='Acciones de usuario' disabledKeys={['user-data']}>
                <DropdownItem key='profile' startContent={<UserCircle size={18} />}>
                  Mi Perfil
                </DropdownItem>
                <DropdownItem key='settings' startContent={<Settings size={18} />}>
                  Configuración
                </DropdownItem>
                <DropdownItem key='theme' onClick={toggleTheme} startContent={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}>
                  Tema {theme === 'light' ? 'oscuro' : 'claro'}
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
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out  bg-gray-50 dark:bg-gray-900 ${
          isSidebarCollapsed ? 'md:ml-20' : isMinimumWidth ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Top Navigation Bar */}
        <Navbar
          isBordered
          maxWidth='full'
          className='fixed top-0 left-0 right-0 z-30 h-16 w-full'
          isMenuOpen={isMenuOpen}
          onMenuOpenChange={setIsMenuOpen}
        >
          <NavbarContent className='md:hidden' justify='start'>
            <NavbarMenuToggle aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} icon={<Menu size={24} className='flex-shrink' />} />
            <NavbarBrand className='md:hidden'>
              <img src={logo} alt='Logo' className='w-8 h-8' />
            </NavbarBrand>
          </NavbarContent>

          <NavbarContent justify='end' className='gap-4'>
            <NotificationManager />
          </NavbarContent>

          {/* Mobile Navigation Menu */}
          <NavbarMenu className='pt-6'>
            {navigation.map((item) => (
              <NavbarMenuItem key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full ${
                    location.pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              </NavbarMenuItem>
            ))}
            <NavbarMenuItem className='fixed bottom-12 pb-6 flex items-center justify-between'>
              <Dropdown placement='top-start'>
                <DropdownTrigger>
                  <User
                    avatarProps={{
                      src: `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}&chars=1`,
                      isBordered: true,
                      color: 'primary'
                    }}
                    description={user?.role}
                    name={user?.name}
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label='Acciones de usuario' disabledKeys={['user-data']}>
                  <DropdownItem key='profile' startContent={<UserCircle size={18} />}>
                    Mi Perfil
                  </DropdownItem>
                  <DropdownItem key='settings' startContent={<Settings size={18} />}>
                    Configuración
                  </DropdownItem>
                  <DropdownItem key='theme' onClick={toggleTheme} startContent={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}>
                    Tema {theme === 'light' ? 'oscuro' : 'claro'}
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
            </NavbarMenuItem>
          </NavbarMenu>
        </Navbar>

        {/* Main Content Area */}
        <main className='flex-1 p-4 md:p-8 mt-16 overflow-auto'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
