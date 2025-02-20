import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@nextui-org/react';

interface DeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export default function DeleteRequestModal({
  isOpen,
  onClose,
  onDelete,
}: DeleteRequestModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Confirmar Eliminación</ModalHeader>
            <ModalBody>
              ¿Está seguro que desea eliminar esta solicitud?
              Esta acción no se puede deshacer.
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="danger" onPress={onDelete}>
                Eliminar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}