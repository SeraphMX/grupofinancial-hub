import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  User,
} from '@nextui-org/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import {
  CreditCard,
  Users,
  FileText,
  Briefcase,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import NotificationManager from './NotificationManager';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Solicitudes', path: '/solicitudes', icon: CreditCard },
    { name: 'Trámites', path: '/tramites', icon: FileText },
    { name: 'Portafolio', path: '/portafolio', icon: Briefcase },
    { name: 'Usuarios', path: '/usuarios', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        {/* Logo */}
        <div 
          className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <CreditCard className="mr-2 text-primary" size={24} />
          <span className="font-bold text-xl">Grupo Financial</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Navbar isBordered className="border-b border-gray-200 dark:border-gray-800">
          <NavbarContent justify="end">
            <NotificationManager />
            
            <Button
              isIconOnly
              variant="light"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </Button>

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <User
                  name={user?.name}
                  description={user?.role}
                  className="cursor-pointer"
                  avatarProps={{
                    src: `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`,
                  }}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Acciones de usuario">
                <DropdownItem
                  key="logout"
                  className="text-danger"
                  color="danger"
                  startContent={<LogOut size={18} />}
                  onClick={() => dispatch(logout())}
                >
                  Cerrar sesión
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>
        </Navbar>

        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}