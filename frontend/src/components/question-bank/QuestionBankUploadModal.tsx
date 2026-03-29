import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { File, FileText, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import {
  apiUploadQuestionBank,
  apiFetchFacultyAccessibleBatches,
  type ApiQuestionBankBatchSummary,
  type ApiQuestionBankFile,
} from '../../api/questionBank';

function formatDifficulty(value: ApiQuestionBankFile['difficulty']) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) {
    return <ImageIcon className="w-5 h-5 text-blue-600" />;
  }
  if ((ext || '') === 'pdf') {
    return <FileText className="w-5 h-5 text-red-600" />;
  }
  return <File className="w-5 h-5 text-gray-600" />;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function QuestionBankUploadModal({
  userSubject,
  availableBatches: fallbackBatches,
  onClose,
  onUploaded,
}: {
  userSubject: string;
  availableBatches: ApiQuestionBankBatchSummary[];
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [batches, setBatches] = useState<ApiQuestionBankBatchSummary[]>(fallbackBatches);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Fetch fresh batches from backend when modal opens to avoid stale data
  useEffect(() => {
    const loadBatches = async () => {
      setLoadingBatches(true);
      try {
        const freshBatches = await apiFetchFacultyAccessibleBatches();
        setBatches(freshBatches);
      } catch (error) {
        console.error('Failed to fetch accessible batches:', error);
        // Fall back to passed batches on error
        setBatches(fallbackBatches);
      } finally {
        setLoadingBatches(false);
      }
    };
    
    void loadBatches();
  }, [fallbackBatches]);

  const isFormValid = title.trim().length > 0 && selectedBatchIds.length > 0 && !!selectedFile;
  const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
  ]);

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileSelection = (fileList?: FileList | null) => {
    const nextFile = fileList?.[0];
    if (!nextFile) return;
    if (!allowedMimeTypes.has(nextFile.type)) {
      setSelectedFile(null);
      setUploadError('Unsupported file format. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG.');
      return;
    }
    if (nextFile.size > 50 * 1024 * 1024) {
      setSelectedFile(null);
      setUploadError('File is too large. Maximum allowed size is 50MB.');
      return;
    }
    setUploadError('');
    setSelectedFile(nextFile);
  };

  const toggleBatch = (batchId: string) => {
    setUploadError('');
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((value) => value !== batchId) : [...prev, batchId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid || !selectedFile) return;

    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('difficulty', difficulty);
      selectedBatchIds.forEach((batchId) => formData.append('batch_ids', batchId));
      formData.append('file', selectedFile);
      await apiUploadQuestionBank(formData);
      await onUploaded();
    } catch (error: any) {
      console.error(error);
      setUploadError(error.message || 'Failed to upload question bank file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-layer-10001">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-blue-600 text-white flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Add to Question Bank</h3>
            <p className="text-teal-50 text-sm opacity-90">Upload one file and publish it to selected batches</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {uploadError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {uploadError}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              File Information
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setUploadError('');
                  }}
                  placeholder="e.g., Electrostatics Practice Sheet 01"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty *</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {(['easy', 'medium', 'hard'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDifficulty(value)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          difficulty === value ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {formatDifficulty(value)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-bold">
                    {userSubject || 'Mapped from faculty profile'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Publish to Batches * {loadingBatches && <Loader2 className="w-4 h-4 inline animate-spin" />}</label>
                {batches.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {loadingBatches ? 'Loading batches...' : 'No batches available for you.'}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {batches.map((batch) => (
                      <button
                        key={batch.id}
                        type="button"
                        onClick={() => toggleBatch(batch.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          selectedBatchIds.includes(batch.id)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {batch.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Upload File
            </h2>

            {!selectedFile && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDragActive(false);
                  handleFileSelection(event.dataTransfer.files);
                }}
                className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(event) => handleFileSelection(event.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop your file here or click to browse</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload exactly one file for the question bank</p>
                  <p className="text-xs text-gray-500">Single file only, up to 50MB</p>
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Selected File</h3>
                <motion.div
                  key={selectedFile.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-100"
                >
                  <div className="flex-shrink-0">{getFileIcon(selectedFile.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadError('');
                    }}
                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || uploading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploading ? 'Uploading...' : 'Upload Content'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
