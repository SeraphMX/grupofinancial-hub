import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react'

interface DeleteRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel: () => Promise<void>
}

export default function CancelRequestModal({ isOpen, onClose, onCancel }: DeleteRequestModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size='sm'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Confirmar Cancelación</ModalHeader>
            <ModalBody>¿Está seguro que desea cancelar esta solicitud? Esta acción no se puede deshacer.</ModalBody>
            <ModalFooter>
              <Button variant='light' onPress={onClose}>
                Cerrar
              </Button>
              <Button color='danger' onPress={onCancel}>
                Cancelar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
