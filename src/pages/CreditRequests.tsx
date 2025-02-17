import { useState } from 'react';
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
} from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, CreditCard, Building2, Plus, Search } from 'lucide-react';
import {
  personalCreditSchema,
  businessCreditSchema,
  type PersonalCreditForm,
  type BusinessCreditForm,
} from '../schemas/creditSchemas';

interface CreditRequest {
  id: string;
  type: 'personal' | 'business';
  applicantName: string;
  amount: number;
  term: number;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  createdAt: string;
}

const mockRequests: CreditRequest[] = [
  {
    id: '1',
    type: 'personal',
    applicantName: 'Juan Pérez',
    amount: 15000,
    term: 24,
    status: 'pending',
    createdAt: '2024-03-01T00:00:00.000Z',
  },
  {
    id: '2',
    type: 'business',
    applicantName: 'Empresa Ejemplo S.A.',
    amount: 100000,
    term: 36,
    status: 'in_review',
    createdAt: '2024-03-01T00:00:00.000Z',
  },
];

export default function CreditRequests() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState('personal');
  const [filterValue, setFilterValue] = useState('');

  const personalForm = useForm<PersonalCreditForm>({
    resolver: zodResolver(personalCreditSchema),
    defaultValues: {
      applicantName: '',
      applicantId: '',
      income: 0,
      amount: 0,
      term: 12,
      purpose: '',
    },
  });

  const businessForm = useForm<BusinessCreditForm>({
    resolver: zodResolver(businessCreditSchema),
    defaultValues: {
      businessName: '',
      businessId: '',
      annualRevenue: 0,
      amount: 0,
      term: 12,
      purpose: '',
    },
  });

  const handlePersonalSubmit = (data: PersonalCreditForm) => {
    console.log('Personal credit request:', data);
    onClose();
  };

  const handleBusinessSubmit = (data: BusinessCreditForm) => {
    console.log('Business credit request:', data);
    onClose();
  };

  const filteredRequests = mockRequests.filter((request) =>
    request.applicantName.toLowerCase().includes(filterValue.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Solicitudes de Crédito</h2>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={onOpen}
        >
          Nueva Solicitud
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              placeholder="Buscar por nombre..."
              startContent={<Search className="text-default-300" size={18} />}
              value={filterValue}
              onClear={() => setFilterValue("")}
              onChange={(e) => setFilterValue(e.target.value)}
            />

            <Table aria-label="Tabla de solicitudes">
              <TableHeader>
                <TableColumn>SOLICITANTE</TableColumn>
                <TableColumn>TIPO</TableColumn>
                <TableColumn>MONTO</TableColumn>
                <TableColumn>PLAZO</TableColumn>
                <TableColumn>ESTADO</TableColumn>
                <TableColumn>FECHA</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.applicantName}</TableCell>
                    <TableCell>
                      <Chip
                        variant="flat"
                        color={request.type === 'personal' ? 'primary' : 'secondary'}
                      >
                        {request.type === 'personal' ? 'Personal' : 'Empresarial'}
                      </Chip>
                    </TableCell>
                    <TableCell>${request.amount.toLocaleString('es-ES')}</TableCell>
                    <TableCell>{request.term} meses</TableCell>
                    <TableCell>
                      <Chip
                        variant="flat"
                        color={
                          request.status === 'approved'
                            ? 'success'
                            : request.status === 'rejected'
                            ? 'danger'
                            : request.status === 'in_review'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {request.status === 'approved'
                          ? 'Aprobada'
                          : request.status === 'rejected'
                          ? 'Rechazada'
                          : request.status === 'in_review'
                          ? 'En Revisión'
                          : 'Pendiente'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
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
              <ModalHeader>Nueva Solicitud de Crédito</ModalHeader>
              <ModalBody>
                <Tabs
                  selectedKey={selected}
                  onSelectionChange={(key) => setSelected(key.toString())}
                >
                  <Tab
                    key="personal"
                    title={
                      <div className="flex items-center gap-2">
                        <User size={18} />
                        <span>Personal</span>
                      </div>
                    }
                  >
                    <form
                      onSubmit={personalForm.handleSubmit(handlePersonalSubmit)}
                      className="space-y-4 mt-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                          name="applicantName"
                          control={personalForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="Nombre completo"
                              placeholder="Juan Pérez"
                              errorMessage={personalForm.formState.errors.applicantName?.message}
                              isInvalid={!!personalForm.formState.errors.applicantName}
                            />
                          )}
                        />
                        <Controller
                          name="applicantId"
                          control={personalForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="Identificación"
                              placeholder="12345678"
                              errorMessage={personalForm.formState.errors.applicantId?.message}
                              isInvalid={!!personalForm.formState.errors.applicantId}
                            />
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Controller
                          name="income"
                          control={personalForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              label="Ingreso mensual"
                              placeholder="0.00"
                              startContent={
                                <div className="pointer-events-none flex items-center">
                                  <span className="text-default-400 text-small">$</span>
                                </div>
                              }
                              errorMessage={personalForm.formState.errors.income?.message}
                              isInvalid={!!personalForm.formState.errors.income}
                            />
                          )}
                        />
                        <Controller
                          name="amount"
                          control={personalForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              label="Monto solicitado"
                              placeholder="0.00"
                              startContent={
                                <div className="pointer-events-none flex items-center">
                                  <span className="text-default-400 text-small">$</span>
                                </div>
                              }
                              errorMessage={personalForm.formState.errors.amount?.message}
                              isInvalid={!!personalForm.formState.errors.amount}
                            />
                          )}
                        />
                        <Controller
                          name="term"
                          control={personalForm.control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Plazo (meses)"
                              placeholder="Seleccione el plazo"
                              errorMessage={personalForm.formState.errors.term?.message}
                              isInvalid={!!personalForm.formState.errors.term}
                            >
                              {[12, 24, 36, 48, 60].map((months) => (
                                <SelectItem key={months} value={months}>
                                  {months} meses
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                      </div>

                      <Controller
                        name="purpose"
                        control={personalForm.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            label="Propósito del crédito"
                            placeholder="Describa el propósito del crédito"
                            errorMessage={personalForm.formState.errors.purpose?.message}
                            isInvalid={!!personalForm.formState.errors.purpose}
                          />
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button variant="light" onPress={onClose}>
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          color="primary"
                          startContent={<CreditCard size={18} />}
                        >
                          Enviar solicitud
                        </Button>
                      </div>
                    </form>
                  </Tab>

                  <Tab
                    key="business"
                    title={
                      <div className="flex items-center gap-2">
                        <Building2 size={18} />
                        <span>Empresarial</span>
                      </div>
                    }
                  >
                    <form
                      onSubmit={businessForm.handleSubmit(handleBusinessSubmit)}
                      className="space-y-4 mt-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                          name="businessName"
                          control={businessForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="Nombre de la empresa"
                              placeholder="Empresa S.A."
                              errorMessage={businessForm.formState.errors.businessName?.message}
                              isInvalid={!!businessForm.formState.errors.businessName}
                            />
                          )}
                        />
                        <Controller
                          name="businessId"
                          control={businessForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="RUC"
                              placeholder="20123456789"
                              errorMessage={businessForm.formState.errors.businessId?.message}
                              isInvalid={!!businessForm.formState.errors.businessId}
                            />
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Controller
                          name="annualRevenue"
                          control={businessForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              label="Ingresos anuales"
                              placeholder="0.00"
                              startContent={
                                <div className="pointer-events-none flex items-center">
                                  <span className="text-default-400 text-small">$</span>
                                </div>
                              }
                              errorMessage={businessForm.formState.errors.annualRevenue?.message}
                              isInvalid={!!businessForm.formState.errors.annualRevenue}
                            />
                          )}
                        />
                        <Controller
                          name="amount"
                          control={businessForm.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              label="Monto solicitado"
                              placeholder="0.00"
                              startContent={
                                <div className="pointer-events-none flex items-center">
                                  <span className="text-default-400 text-small">$</span>
                                </div>
                              }
                              errorMessage={businessForm.formState.errors.amount?.message}
                              isInvalid={!!businessForm.formState.errors.amount}
                            />
                          )}
                        />
                        <Controller
                          name="term"
                          control={businessForm.control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Plazo (meses)"
                              placeholder="Seleccione el plazo"
                              errorMessage={businessForm.formState.errors.term?.message}
                              isInvalid={!!businessForm.formState.errors.term}
                            >
                              {[12, 24, 36, 48, 60].map((months) => (
                                <SelectItem key={months} value={months}>
                                  {months} meses
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                      </div>

                      <Controller
                        name="purpose"
                        control={businessForm.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            label="Propósito del crédito"
                            placeholder="Describa el propósito del crédito"
                            errorMessage={businessForm.formState.errors.purpose?.message}
                            isInvalid={!!businessForm.formState.errors.purpose}
                          />
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button variant="light" onPress={onClose}>
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          color="primary"
                          startContent={<CreditCard size={18} />}
                        >
                          Enviar solicitud
                        </Button>
                      </div>
                    </form>
                  </Tab>
                </Tabs>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}