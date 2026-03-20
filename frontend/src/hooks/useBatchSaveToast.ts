import { useCallback, useEffect, useRef, useState } from 'react';

export type BatchSaveToastState = {
  visible: boolean;
  status: 'saving' | 'saved' | 'error';
  message: string;
};

export function useBatchSaveToast() {
  const [batchSaveToast, setBatchSaveToast] = useState<BatchSaveToastState>({
    visible: false,
    status: 'saving',
    message: '',
  });
  const batchSaveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBatchToast = useCallback((
    status: BatchSaveToastState['status'],
    message: string,
    autoHideMs = 2500,
  ) => {
    if (batchSaveToastTimer.current) {
      clearTimeout(batchSaveToastTimer.current);
    }

    setBatchSaveToast({ visible: true, status, message });

    if (status !== 'saving') {
      batchSaveToastTimer.current = setTimeout(() => {
        setBatchSaveToast((prev) => ({ ...prev, visible: false }));
      }, autoHideMs);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (batchSaveToastTimer.current) {
        clearTimeout(batchSaveToastTimer.current);
      }
    };
  }, []);

  return {
    batchSaveToast,
    setBatchSaveToast,
    showBatchToast,
  };
}
