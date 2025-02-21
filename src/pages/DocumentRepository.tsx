import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Chip,
  Button,
  Progress,
  useDisclosure,
} from '@nextui-org/react';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/cloudflare';
import { FileCheck, FileX, Upload, FileText } from 'lucide-react';
import UploadDocumentModal from '../components/modals/UploadDocumentModal';

interface Document {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  description: string;
}

const requiredDocuments: Document[] = [
  {
    id: '1',
    name: 'Identificación oficial',
    required: true,
    uploaded: false,
    description: 'INE, pasaporte o cédula profesional vigente',
  },
  {
    id: '2',
    name: 'Comprobante de domicilio',
    required: true,
    uploaded: false,
    description: 'No mayor a 3 meses de antigüedad',
  },
  {
    id: '3',
    name: 'Comprobante de ingresos',
    required: true,
    uploaded: false,
    description: 'Últimos 3 recibos de nómina o estados de cuenta',
  },
  {
    id: '4',
    name: 'Declaración de impuestos',
    required: false,
    uploaded: false,
    description: 'Última declaración anual',
  },
];

export default function DocumentRepository() {
  const { requestId } = useParams();
  const [selectedTab, setSelectedTab] = useState('info');
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState(requiredDocuments);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error('Error al obtener la solicitud:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (file: File, documentType: string, description: string) => {
    try {
      // Subir el archivo a Cloudflare R2
      const uploadResult = await uploadToR2(file);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Guardar la referencia del documento en Supabase
      const { error } = await supabase
        .from('documentos')
        .insert([{
          solicitud_id: requestId,
          nombre: file.name,
          tipo: documentType,
          url: uploadResult.url,
          descripcion: description,
        }]);

      if (error) throw error;

      // Actualizar el estado local
      setDocuments(documents.map(doc => 
        doc.id === selectedDocumentId
          ? { ...doc, uploaded: true }
          : doc
      ));

      onClose();
    } catch (error) {
      console.error('Error al subir el documento:', error);
      throw error;
    }
  };

  const progress = Math.round(
    (documents.filter(d => d.uploaded).length / documents.filter(d => d.required).length) * 100
  );

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!request) {
    return <div>Solicitud no encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Repositorio de Documentos</h1>
          <p className="text-default-500">
            Solicitud #{requestId} - {request.nombre}
          </p>
        </CardHeader>
        <CardBody>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
          >
            <Tab
              key="info"
              title={
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <span>Información</span>
                </div>
              }
            >
              <div className="py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-small font-medium text-default-500">Tipo de Crédito</h3>
                    <p className="text-medium">{request.tipo_credito}</p>
                  </div>
                  <div>
                    <h3 className="text-small font-medium text-default-500">Monto</h3>
                    <p className="text-medium">${request.monto.toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <h3 className="text-small font-medium text-default-500">Plazo</h3>
                    <p className="text-medium">{request.plazo} meses</p>
                  </div>
                  <div>
                    <h3 className="text-small font-medium text-default-500">Estado</h3>
                    <Chip variant="flat" color="primary">{request.status}</Chip>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab
              key="documents"
              title={
                <div className="flex items-center gap-2">
                  <Upload size={18} />
                  <span>Documentos</span>
                </div>
              }
            >
              <div className="py-4 space-y-6">
                <div className="flex items-center gap-4">
                  <Progress
                    size="md"
                    value={progress}
                    color="primary"
                    showValueLabel
                    className="max-w-md"
                  />
                  <span className="text-small text-default-500">
                    {documents.filter(d => d.uploaded).length} de {documents.filter(d => d.required).length} documentos requeridos
                  </span>
                </div>

                <div className="space-y-4">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {doc.uploaded ? (
                            <FileCheck className="text-success" size={24} />
                          ) : (
                            <FileX className="text-danger" size={24} />
                          )}
                          <div>
                            <h3 className="text-medium font-semibold">
                              {doc.name}
                              {doc.required && (
                                <Chip size="sm" variant="flat" color="danger" className="ml-2">
                                  Requerido
                                </Chip>
                              )}
                            </h3>
                            <p className="text-small text-default-500">{doc.description}</p>
                          </div>
                        </div>
                        <Button
                          color={doc.uploaded ? "success" : "primary"}
                          variant={doc.uploaded ? "flat" : "solid"}
                          onPress={() => {
                            setSelectedDocumentId(doc.id);
                            onOpen();
                          }}
                        >
                          {doc.uploaded ? 'Actualizar' : 'Subir'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <UploadDocumentModal
        isOpen={isOpen}
        onClose={onClose}
        onUpload={handleUploadDocument}
      />
    </div>
  );
}