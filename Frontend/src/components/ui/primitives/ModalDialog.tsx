import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * ModalDialog – Modal thuần Tailwind + Framer-motion.
 * Bấm nền đen hoặc nút đóng sẽ gọi onClose.
 */
const ModalDialog: React.FC<ModalDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  className = ''
}) => {
  // Vô hiệu hoá scroll nền khi mở modal
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`bg-white rounded-xl w-full max-w-lg mx-4 p-6 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {title && <h3 className="font-semibold text-lg mb-4 text-gray-800 flex items-center gap-2">{title}</h3>}

            <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar text-gray-700">
              {children}
            </div>

            {actions && <div className="mt-6 flex justify-end gap-2">{actions}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ModalDialog; 