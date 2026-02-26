import { useState } from 'react';
import { ClipboardList, Play, Award, Clock } from 'lucide-react';
import { DPPPractice } from './DPPPractice';
import { motion } from 'motion/react';

interface DPP {
  id: string;
  title: string;
  subject: string;
  totalQuestions: number;
  duration: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  score?: number;
}

const MOCK_DPPS: DPP[] = [
  {
    id: '1',
    title: 'Physics - Kinematics DPP #15',
    subject: 'Physics',
    totalQuestions: 20,
    duration: 60,
    difficulty: 'Medium',
    completed: false
  },
  {
    id: '2',
    title: 'Chemistry - Chemical Bonding DPP #8',
    subject: 'Chemistry',
    totalQuestions: 15,
    duration: 45,
    difficulty: 'Hard',
    completed: true,
    score: 87
  },
  {
    id: '3',
    title: 'Mathematics - Trigonometry DPP #12',
    subject: 'Mathematics',
    totalQuestions: 25,
    duration: 75,
    difficulty: 'Medium',
    completed: false
  },
  {
    id: '4',
    title: 'Physics - Electrostatics DPP #9',
    subject: 'Physics',
    totalQuestions: 18,
    duration: 60,
    difficulty: 'Easy',
    completed: true,
    score: 94
  },
  {
    id: '5',
    title: 'Chemistry - Thermodynamics DPP #6',
    subject: 'Chemistry',
    totalQuestions: 20,
    duration: 60,
    difficulty: 'Hard',
    completed: false
  },
  {
    id: '6',
    title: 'Mathematics - Calculus DPP #18',
    subject: 'Mathematics',
    totalQuestions: 22,
    duration: 70,
    difficulty: 'Medium',
    completed: true,
    score: 78
  },
];

export function DPPSection() {
  const [selectedDPP, setSelectedDPP] = useState<DPP | null>(null);

  if (selectedDPP) {
    return (
      <DPPPractice 
        dpp={selectedDPP} 
        onExit={() => setSelectedDPP(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Practice Problems</h2>
            <p className="text-gray-600">Practice with timed tests to improve your skills</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total DPPs</p>
              <p className="text-3xl font-bold text-gray-900">{MOCK_DPPS.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                {MOCK_DPPS.filter(d => d.completed).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg. Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(
                  MOCK_DPPS.filter(d => d.score).reduce((acc, d) => acc + (d.score || 0), 0) /
                  MOCK_DPPS.filter(d => d.score).length
                )}%
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>
      </div>

      {/* DPP List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Available DPPs</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {MOCK_DPPS.map(dpp => (
            <div
              key={dpp.id}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{dpp.title}</h3>
                    {dpp.completed && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <ClipboardList className="w-4 h-4" />
                      <span>{dpp.totalQuestions} Questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{dpp.duration} min</span>
                    </div>
                  </div>

                  {dpp.completed && dpp.score !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Your Score</span>
                        <span className="font-semibold text-gray-900">{dpp.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-teal-600 to-cyan-600 h-2 rounded-full transition-all"
                          style={{ width: `${dpp.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedDPP(dpp)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition shadow-md hover:shadow-lg flex-shrink-0"
                >
                  <Play className="w-4 h-4" />
                  {dpp.completed ? 'Retry' : 'Start'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}