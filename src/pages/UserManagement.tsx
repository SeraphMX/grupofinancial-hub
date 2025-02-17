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
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
} from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  UserPlus,
  Mail,
  User,
  Shield,
  Calendar,
  MoreVertical,
  Edit,
  Trash,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'supervisor';
  createdAt: string;
}

const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'agent', 'supervisor'], {
    required_error: 'El rol es requerido',
  }),
});

type UserForm = z.infer<typeof userSchema>;

const roleColorMap = {
  admin: "danger",
  agent: "primary",
  supervisor: "warning",
} as const;

const roleTextMap = {
  admin: "Administrador",
  agent: "Agente",
  supervisor: "Supervisor",
} as const;

const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin Usuario",
    email: "admin@creditgest.com",
    role: "admin",
    createdAt: "2024-03-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Agente Ejemplo",
    email: "agente@creditgest.com",
    role: "agent",
    createdAt: "2024-03-01T00:00:00.000Z",
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filterValue, setFilterValue] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'agent',
    },
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.name.toLowerCase().includes(filterValue.toLowerCase()) ||
      user.email.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [users, filterValue]);

  const handleSubmit = (data: UserForm) => {
    if (editingUser) {
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...data }
          : user
      ));
    } else {
      const newUser: User = {
        id: (users.length + 1).toString(),
        ...data,
        createdAt: new Date().toISOString(),
      };
      setUsers([...users, newUser]);
    }
    onClose();
    form.reset();
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    onOpen();
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleAddNew = () => {
    setEditingUser(null);
    form.reset({
      name: '',
      email: '',
      role: 'agent',
    });
    onOpen();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <Button
          color="primary"
          startContent={<UserPlus size={18} />}
          onPress={handleAddNew}
        >
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              placeholder="Buscar por nombre o email..."
              startContent={<Search className="text-default-300" size={18} />}
              value={filterValue}
              onClear={() => setFilterValue("")}
              onChange={(e) => setFilterValue(e.target.value)}
            />

            <Table aria-label="Tabla de usuarios">
              <TableHeader>
                <TableColumn>USUARIO</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>ROL</TableColumn>
                <TableColumn>FECHA DE CREACIÓN</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <User size={24} className="text-default-400" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        variant="flat"
                        color={roleColorMap[user.role]}
                      >
                        {roleTextMap[user.role]}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-default-400" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleEdit(user)}
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(user.id)}
                        >
                          <Trash size={18} />
                        </Button>
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
        isOpen={isOpen}
        onClose={onClose}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <ModalHeader>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Nombre"
                        placeholder="Nombre completo"
                        startContent={<User className="text-default-400" size={16} />}
                        errorMessage={form.formState.errors.name?.message}
                      />
                    )}
                  />
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Email"
                        placeholder="correo@ejemplo.com"
                        startContent={<Mail className="text-default-400" size={16} />}
                        errorMessage={form.formState.errors.email?.message}
                      />
                    )}
                  />
                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Rol"
                        placeholder="Seleccione un rol"
                        startContent={<Shield className="text-default-400" size={16} />}
                        errorMessage={form.formState.errors.role?.message}
                      >
                        <SelectItem key="admin" value="admin">
                          Administrador
                        </SelectItem>
                        <SelectItem key="agent" value="agent">
                          Agente
                        </SelectItem>
                        <SelectItem key="supervisor" value="supervisor">
                          Supervisor
                        </SelectItem>
                      </Select>
                    )}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" type="submit">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}