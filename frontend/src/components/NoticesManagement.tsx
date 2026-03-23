import { useEffect, useState } from 'react';
import { ChevronLeft, Megaphone, Plus, Pencil, Trash2 } from 'lucide-react';
import { ApiBatch } from '../api/batches';
import { broadcastNotice, deleteNoticeById, fetchMyNotices, updateNotice, type ApiNotice } from '../api/facultyReviews';
import UploadNoticeModal from './UploadNoticeModal';

type NoticeFormState = {
  id?: string;
  title: string;
  message: string;
  batchIds: string[];
};

export function NoticesManagement({
  batches,
  userRole,
  onBack,
}: {
  batches: ApiBatch[];
  userRole: 'admin' | 'faculty';
  onBack?: () => void;
}) {
  const [notices, setNotices] = useState<ApiNotice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeFormState | null>(null);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await fetchMyNotices();
      setNotices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotices();
  }, []);

  const handleCreate = () => {
    setEditingNotice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (notice: ApiNotice) => {
    setEditingNotice({
      id: notice.id,
      title: notice.title,
      message: notice.message,
      batchIds: notice.batch_ids || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (noticeId: string) => {
    const confirmed = window.confirm('Delete this notice? This will remove it for all students.');
    if (!confirmed) return;
    await deleteNoticeById(noticeId);
    await loadNotices();
  };

  const handleSubmit = async (payload: { batchIds: string[]; title: string; message: string }) => {
    if (editingNotice?.id) {
      await updateNotice(editingNotice.id, payload);
      return;
    }
    await broadcastNotice(payload);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full border border-white/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all mt-1"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-3xl font-bold text-gray-900">Notices</h2>
            <p className="text-gray-600">Manage the notices you have posted to student batches.</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-xl font-bold shadow-md whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Post Notice
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No notices posted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-4 text-sm font-semibold text-gray-600">#</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-600">Title</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-600">Timestamp</th>
                  <th className="py-4 px-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notices.map((notice, index) => (
                  <tr key={notice.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">{notice.title}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                        <Megaphone className="w-3 h-3" />
                        {notice.batch_ids?.length || 0} batches
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(notice.created_at).toLocaleDateString()} {new Date(notice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(notice)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(notice.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadNoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batches={batches}
        userRole={userRole}
        initialNotice={editingNotice || undefined}
        onSubmit={handleSubmit}
        onSubmitted={loadNotices}
      />
    </div>
  );
}
