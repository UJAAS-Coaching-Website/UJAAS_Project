import { useState } from 'react';
import { Download, FileText, Search, Filter, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface Note {
  id: string;
  title: string;
  subject: string;
  topic: string;
  uploadDate: string;
  fileSize: string;
  downloads: number;
}

const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Organic Chemistry - Reaction Mechanisms',
    subject: 'Chemistry',
    topic: 'Organic Chemistry',
    uploadDate: '2026-02-05',
    fileSize: '2.4 MB',
    downloads: 234
  },
  {
    id: '2',
    title: 'Newton\'s Laws of Motion - Complete Guide',
    subject: 'Physics',
    topic: 'Mechanics',
    uploadDate: '2026-02-04',
    fileSize: '1.8 MB',
    downloads: 198
  },
  {
    id: '3',
    title: 'Coordinate Geometry - Circle & Parabola',
    subject: 'Mathematics',
    topic: 'Coordinate Geometry',
    uploadDate: '2026-02-03',
    fileSize: '3.1 MB',
    downloads: 287
  },
  {
    id: '4',
    title: 'Thermodynamics - Laws and Applications',
    subject: 'Physics',
    topic: 'Thermodynamics',
    uploadDate: '2026-02-02',
    fileSize: '2.2 MB',
    downloads: 156
  },
  {
    id: '5',
    title: 'Differential Equations - Methods',
    subject: 'Mathematics',
    topic: 'Calculus',
    uploadDate: '2026-02-01',
    fileSize: '1.9 MB',
    downloads: 143
  },
  {
    id: '6',
    title: 'Electrochemistry - Cells and EMF',
    subject: 'Chemistry',
    topic: 'Physical Chemistry',
    uploadDate: '2026-01-30',
    fileSize: '2.7 MB',
    downloads: 178
  },
  {
    id: '7',
    title: 'Vectors and 3D Geometry',
    subject: 'Mathematics',
    topic: '3D Geometry',
    uploadDate: '2026-01-28',
    fileSize: '2.0 MB',
    downloads: 201
  },
  {
    id: '8',
    title: 'Wave Optics - Interference & Diffraction',
    subject: 'Physics',
    topic: 'Optics',
    uploadDate: '2026-01-25',
    fileSize: '2.5 MB',
    downloads: 167
  },
];

export function NotesSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];

  const filteredNotes = MOCK_NOTES.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleDownload = (note: Note) => {
    // In a real app, this would download the actual PDF
    alert(`Downloading: ${note.title}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Study Notes</h2>
            <p className="text-gray-600">Download comprehensive study materials</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="pl-11 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white cursor-pointer min-w-[180px]"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.map(note => (
          <motion.div
            key={note.id}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-red-600" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {note.title}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {note.subject}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {note.topic}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>{note.fileSize}</span>
                  <span>•</span>
                  <span>{note.downloads} downloads</span>
                </div>

                <button
                  onClick={() => handleDownload(note)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white rounded-lg transition shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>

            {/* Upload Date */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Uploaded on {new Date(note.uploadDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredNotes.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-md border border-gray-100 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
