import { Modal, ModalBody, ModalContent } from '@nextui-org/react'

import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { resetForm } from '../../store/slices/creditSlice'
import CreditWizard from '../CreditWizard'

interface CreateRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateRequestModal({ isOpen, onClose }: CreateRequestModalProps): JSX.Element {
  const dispatch = useDispatch()
  const { creditType, clientType, step } = useSelector((state: RootState) => state.credit)

  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.style.overflow = 'hidden' // Forzar recalculo
      setTimeout(() => {
        modalRef.current!.style.overflow = 'auto' // Restaurar scroll
      }, 50) // Pequeño delay para que se apliquen los cambios
    }
  }, [step, clientType, creditType])

  useEffect(() => {
    dispatch(resetForm())
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose()
      }}
      size='xl'
      scrollBehavior='inside'
    >
      <ModalContent>
        {(onClose) => (
          <div ref={modalRef}>
            <ModalBody>
              <CreditWizard OnClose={onClose} />
            </ModalBody>
          </div>
        )}
      </ModalContent>
    </Modal>
  )
}
