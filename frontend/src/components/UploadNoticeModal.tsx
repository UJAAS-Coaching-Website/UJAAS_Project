import React, { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, Loader2, Check } from 'lucide-react';
import { ApiBatch } from '../api/batches';
import { broadcastNotice } from '../api/facultyReviews';
import { toast } from 'sonner';

interface UploadNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: ApiBatch[];
  userRole: 'admin' | 'faculty';
}

const UploadNoticeModal: React.FC<UploadNoticeModalProps> = ({ isOpen, onClose, batches, userRole }) => {
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleBatch = (id: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedBatchIds.length === batches.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(batches.map(b => b.id));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedBatchIds.length === 0) {
      toast.error('Please select at least one batch.');
      return;
    }
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      toast.error('Title and message are required.');
      return;
    }

    setIsSending(true);
    try {
      await broadcastNotice({
        batchIds: selectedBatchIds,
        title: noticeTitle.trim(),
        message: noticeMessage.trim()
      });

      toast.success(`Notice broadcasted successfully to ${selectedBatchIds.length} batches.`);
      setNoticeTitle('');
      setNoticeMessage('');
      setSelectedBatchIds([]);
      onClose();
    } catch (error: any) {
      console.error('Failed to send notices:', error);
      toast.error(error.message || 'Failed to send notices.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-layer-modal flex items-center justify-center p-4 sm:p-6 overscroll-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Upload Batch Notice</h3>
              <p className="text-xs text-teal-50 opacity-80">Send announcements to selected batches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* Batch Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-700">Select Batches</label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 transition"
              >
                {selectedBatchIds.length === batches.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar outline-none focus:ring-2 focus:ring-teal-500 rounded-xl" tabIndex={0}>
              {batches.map(batch => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => handleToggleBatch(batch.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    selectedBatchIds.includes(batch.id)
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <span className="font-semibold text-sm truncate">{batch.name}</span>
                  {selectedBatchIds.includes(batch.id) && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
            {batches.length === 0 && (
              <p className="text-sm text-gray-500 italic">No batches available.</p>
            )}
          </div>

          {/* Notice Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Notice Title</label>
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="e.g. Holiday Announcement, Test Schedule Change"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-teal-500 focus:ring-0 transition outline-none"
            />
          </div>

          {/* Notice Message */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Message</label>
            <textarea
              required
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              rows={4}
              placeholder="Type your notice message here..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-teal-500 focus:ring-0 transition outline-none resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm min-w-[160px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSending || selectedBatchIds.length === 0}
            className="px-10 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2 min-w-[160px]"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Megaphone className="w-5 h-5" />
                Post Notice
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadNoticeModal;
