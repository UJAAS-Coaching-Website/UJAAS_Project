import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Download, X } from 'lucide-react';

interface BatchTimetableModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  isMobileViewport?: boolean;
  onDownload?: (() => void) | null;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  emptyStateAction?: ReactNode;
}

export function BatchTimetableModal({
  open,
  onClose,
  imageUrl,
  isMobileViewport = false,
  onDownload = null,
  footerStart,
  footerEnd,
  emptyStateAction,
}: BatchTimetableModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="timetable-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md z-layer-modal"
          onClick={onClose}
        >
          <motion.div
            key="timetable-modal-content"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative max-w-5xl w-full h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col z-layer-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-20">
              <h3 className={`${isMobileViewport ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>Batch Weekly Schedule</h3>
              <button
                onClick={onClose}
                className={`${isMobileViewport ? 'p-1.5' : 'p-2'} hover:bg-gray-100 rounded-full transition-colors`}
              >
                <X className={`${isMobileViewport ? 'w-5 h-5' : 'w-6 h-6'} text-gray-500`} />
              </button>
            </div>

            <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-hidden min-h-0">
              {imageUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Full Time Table"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-xl bg-white"
                  />
                </div>
              ) : (
                <div className="text-center py-20 w-full">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No timetable uploaded yet.</p>
                  {emptyStateAction}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex flex-wrap justify-between items-center gap-3 shrink-0 z-20">
              <div className="flex flex-wrap gap-2">
                {footerStart}
              </div>
              <div className="flex flex-wrap gap-2">
                {imageUrl && onDownload && (
                  <button
                    type="button"
                    onClick={onDownload}
                    className={`${isMobileViewport ? 'px-4 py-1.5 text-sm rounded-lg gap-1.5' : 'px-6 py-2 rounded-xl gap-2'} bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold hover:from-indigo-700 hover:to-blue-700 transition flex items-center shadow-lg shadow-indigo-200/60 border border-indigo-500/60`}
                  >
                    <Download className={`${isMobileViewport ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                    Download
                  </button>
                )}
                {footerEnd}
                <button
                  onClick={onClose}
                  className={`${isMobileViewport ? 'px-4 py-1.5 text-sm rounded-lg' : 'px-6 py-2 rounded-xl'} bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition`}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
