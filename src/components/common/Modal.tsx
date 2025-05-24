import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ModalProps } from '@/types';
import { cn } from '@/lib/utils';

interface ExtendedModalProps extends ModalProps {
  description?: string | undefined;
  confirmText?: string | undefined;
  cancelText?: string | undefined;
  onConfirm?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
  loading?: boolean | undefined;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | undefined;
  showFooter?: boolean | undefined;
  showCloseButton?: boolean | undefined;
  preventCloseOnOverlay?: boolean | undefined;
}

const Modal: React.FC<ExtendedModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'default',
  showFooter = true,
  showCloseButton = true,
  preventCloseOnOverlay = false,
}) => {
  const handleOpenChange = (open: boolean) => {
    if (!open && !preventCloseOnOverlay) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const getMaxWidth = () => {
    switch (size) {
      case 'sm':
        return 'sm:max-w-sm';
      case 'lg':
        return 'sm:max-w-2xl';
      case 'xl':
        return 'sm:max-w-4xl';
      default:
        return 'sm:max-w-md';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          headerClass: 'text-red-600',
          confirmButtonVariant: 'destructive' as const,
        };
      case 'success':
        return {
          headerClass: 'text-green-600',
          confirmButtonVariant: 'default' as const,
        };
      case 'warning':
        return {
          headerClass: 'text-yellow-600',
          confirmButtonVariant: 'default' as const,
        };
      default:
        return {
          headerClass: '',
          confirmButtonVariant: 'default' as const,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(getMaxWidth())}>
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle className={variantStyles.headerClass}>
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className='py-4'>{children}</div>

        {showFooter && (
          <DialogFooter className='gap-2'>
            {showCloseButton && (
              <Button
                variant='outline'
                onClick={handleCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
            )}
            {onConfirm && (
              <Button
                variant={variantStyles.confirmButtonVariant}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className='animate-spin mr-2'>⏳</span>
                    처리중...
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// 확인 모달을 위한 특별한 변형
export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '확인',
  variant = 'default',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      onConfirm={onConfirm}
      confirmText={confirmText}
      variant={variant}
      loading={loading}
      size='sm'
    >
      <div></div>
    </Modal>
  );
};

// 알림 모달을 위한 특별한 변형
export const AlertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}> = ({ isOpen, onClose, title, description, variant = 'default' }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      size='sm'
      showCloseButton={false}
      confirmText='확인'
      onConfirm={onClose}
    >
      <div></div>
    </Modal>
  );
};

export default Modal;
