import { AnimatePresence, motion } from 'motion/react';
import type { BatchSaveToastState } from '../hooks/useBatchSaveToast';

interface BatchSaveToastProps {
  toast: BatchSaveToastState;
  onDismiss: () => void;
}

export function BatchSaveToast({ toast, onDismiss }: BatchSaveToastProps) {
  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 22px',
            borderRadius: 16,
            background: toast.status === 'error'
              ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
              : toast.status === 'saved'
                ? 'linear-gradient(135deg, #059669, #047857)'
                : 'linear-gradient(135deg, #0891b2, #0e7490)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            backdropFilter: 'blur(8px)',
            minWidth: 220,
          }}
        >
          {toast.status === 'saving' && (
            <span
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                border: '2.5px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }}
            />
          )}
          {toast.status === 'saved' && (
            <span style={{ fontSize: 18, flexShrink: 0 }}>✓</span>
          )}
          {toast.status === 'error' && (
            <span style={{ fontSize: 18, flexShrink: 0 }}>✕</span>
          )}
          <span>{toast.message}</span>
          <button
            onClick={onDismiss}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
