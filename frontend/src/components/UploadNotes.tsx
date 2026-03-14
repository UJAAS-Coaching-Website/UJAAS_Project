import { useState } from 'react';
import { 
  ArrowLeft, 
  Upload,
  CheckCircle,
  AlertCircle,
  BookOpen,
  FileText,
  X,
  File,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { apiUploadNote } from '../api/notes';
import { useEffect } from 'react';

interface UploadNotesProps {
  onBack: () => void;
}

const NOTES_RETURN_CONTEXT_KEY = 'ujaasNotesReturnContext';

export function UploadNotes({ onBack }: UploadNotesProps) {
  const [notesData, setNotesData] = useState({
    title: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [chapterInfo, setChapterInfo] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('uploadTargetChapterId');
    const name = localStorage.getItem('uploadTargetChapterName');
    if (id && name) {
      setChapterInfo({ id, name });
    }
  }, []);
  useBodyScrollLock(showSuccess);

  const handleBackNavigation = () => {
    if (!localStorage.getItem(NOTES_RETURN_CONTEXT_KEY)) {
      localStorage.removeItem('uploadTargetChapterId');
      localStorage.removeItem('uploadTargetChapterName');
    }
    onBack();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFile(e.target.files);
    }
  };

  const handleFile = (fileList: FileList) => {
    if (fileList.length > 1) {
      alert('Please upload only one file at a time.');
    }
    const nextFile = fileList[0];
    if (nextFile) {
      setSelectedFile(nextFile);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-blue-600" />;
    } else if (['pdf'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const handleSubmit = async () => {
    if (!chapterInfo || !notesData.title || !selectedFile) return;
    setUploading(true);

    try {
        const formData = new FormData();
        formData.append('chapter_id', chapterInfo.id);
        formData.append('title', notesData.title.trim());
        formData.append('file', selectedFile);

        await apiUploadNote(formData);
        setUploading(false);
        setShowSuccess(true);
        setSelectedFile(null);
        localStorage.removeItem('uploadTargetChapterId');
        localStorage.removeItem('uploadTargetChapterName');
        setTimeout(() => {
          onBack();
        }, 2000);
    } catch (err) {
        console.error(err);
        alert('Failed to upload notes');
        setUploading(false);
    }
  };

  const isFormValid = notesData.title.trim().length > 0 && !!selectedFile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-4 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload Study Notes</h1>
                <p className="text-gray-600">Uploading to chapter: <span className="text-teal-600 font-bold">{chapterInfo?.name || 'Loading...'}</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Notes Information */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Notes Information
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes Title *
                </label>
                <input
                  type="text"
                  value={notesData.title}
                  onChange={(e) => setNotesData({ ...notesData, title: e.target.value })}
                  placeholder="e.g., Wave Optics - Complete Theory Notes"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Upload File
            </h2>

            {/* Drag & Drop Area */}
            {!selectedFile && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileInput}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Upload className="w-10 h-10 text-blue-600" />
                  </motion.div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Drop your file here or click to browse
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Support for PDF, DOC, DOCX, PPT, PPTX, JPG, PNG
                  </p>
                  <p className="text-xs text-gray-500">
                    Upload exactly one file up to 50MB
                  </p>
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Selected File
                </h3>
                <AnimatePresence>
                  <motion.div
                    key={selectedFile.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-100"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(selectedFile.name)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove the file "${selectedFile.name}"?`)) {
                          removeFile();
                        }
                      }}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Uploading...
                  </h3>
                  <p className="text-sm text-gray-600">
                    Please wait while your note is stored in the bucket and saved to the database.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Validation Warning */}
          {(!isFormValid && notesData.title) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Complete all required fields
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                    {!notesData.title && <li>Add a title for the notes</li>}
                    {!selectedFile && <li>Upload one file</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={handleBackNavigation}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSubmit}
              disabled={!isFormValid || uploading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploading ? 'Uploading...' : 'Upload Content'}
            </motion.button>
          </div>
        </motion.div>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto text-center shadow-2xl"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Notes Uploaded Successfully!
                </h3>
                <p className="text-gray-600">
                  Your study notes are now available to all enrolled students.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

