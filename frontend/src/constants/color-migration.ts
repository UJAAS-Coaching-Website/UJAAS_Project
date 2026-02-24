/**
 * Color Migration Script
 * Replace all indigo/purple/pink colors with teal/cyan/blue palette
 * 
 * Usage: Apply these sed-like replacements to all component files
 */

const colorReplacements = [
  // Main gradients (3-color)
  { old: 'from-indigo-600 via-purple-600 to-pink-600', new: 'from-teal-600 via-cyan-600 to-blue-500' },
  { old: 'from-indigo-50 via-purple-50 to-pink-50', new: 'from-teal-50 via-cyan-50 to-blue-50' },
  { old: 'from-indigo-100 via-purple-100 to-pink-100', new: 'from-teal-100 via-cyan-100 to-blue-100' },
  
  // 2-color gradients
  { old: 'from-indigo-600 to-purple-600', new: 'from-teal-600 to-cyan-600' },
  { old: 'from-purple-600 to-pink-600', new: 'from-cyan-600 to-blue-500' },
  { old: 'from-indigo-500 to-purple-500', new: 'from-teal-500 to-cyan-500' },
  { old: 'from-purple-500 to-pink-500', new: 'from-cyan-500 to-blue-500' },
  { old: 'from-indigo-50 to-purple-50', new: 'from-teal-50 to-cyan-50' },
  { old: 'from-purple-50 to-pink-50', new: 'from-cyan-50 to-blue-50' },
  { old: 'from-blue-50 to-indigo-50', new: 'from-teal-50 to-cyan-50' },
  
  // Background colors
  { old: 'bg-indigo-600', new: 'bg-teal-600' },
  { old: 'bg-purple-600', new: 'bg-cyan-600' },
  { old: 'bg-pink-600', new: 'bg-blue-500' },
  { old: 'bg-indigo-100', new: 'bg-teal-100' },
  { old: 'bg-purple-100', new: 'bg-cyan-100' },
  { old: 'bg-pink-100', new: 'bg-blue-100' },
  { old: 'bg-indigo-50', new: 'bg-teal-50' },
  { old: 'bg-purple-50', new: 'bg-cyan-50' },
  { old: 'bg-pink-50', new: 'bg-blue-50' },
  
  // Text colors
  { old: 'text-indigo-600', new: 'text-teal-600' },
  { old: 'text-purple-600', new: 'text-cyan-600' },
  { old: 'text-pink-600', new: 'text-blue-500' },
  { old: 'text-indigo-700', new: 'text-teal-700' },
  { old: 'text-indigo-100', new: 'text-teal-100' },
  { old: 'text-purple-100', new: 'text-cyan-100' },
  { old: 'text-indigo-300', new: 'text-teal-300' },
  
  // Border colors
  { old: 'border-indigo-200', new: 'border-teal-200' },
  { old: 'border-purple-200', new: 'border-cyan-200' },
  { old: 'border-pink-200', new: 'border-blue-200' },
  { old: 'border-indigo-300', new: 'border-teal-300' },
  
  // Ring colors
  { old: 'ring-indigo-600', new: 'ring-teal-600' },
  { old: 'ring-purple-600', new: 'ring-cyan-600' },
  
  // Hover states
  { old: 'hover:text-indigo-600', new: 'hover:text-teal-600' },
  { old: 'hover:text-indigo-700', new: 'hover:text-teal-700' },
  { old: 'hover:text-purple-600', new: 'hover:text-cyan-600' },
  { old: 'hover:bg-indigo-200', new: 'hover:bg-teal-200' },
  { old: 'hover:bg-purple-50', new: 'hover:bg-cyan-50' },
  { old: 'hover:from-indigo-700 hover:to-purple-700', new: 'hover:from-teal-700 hover:to-cyan-700' },
  { old: 'hover:from-purple-700 hover:to-pink-700', new: 'hover:from-cyan-700 hover:to-blue-600' },
  { old: 'hover:shadow-purple-500/50', new: 'hover:shadow-cyan-500/50' },
  
  // Group focus states  
  { old: 'group-focus-within:text-indigo-600', new: 'group-focus-within:text-teal-600' },
  { old: 'group-focus-within:text-purple-600', new: 'group-focus-within:text-cyan-600' },
  { old: 'group-hover:text-indigo-600', new: 'group-hover:text-teal-600' },
  
  // Focus states
  { old: 'focus:ring-indigo-500', new: 'focus:ring-teal-500' },
  { old: 'focus:border-indigo-500', new: 'focus:border-teal-500' },
  
  // Color strings (for gradient prop values)
  { old: "'from-purple-500 to-pink-500'", new: "'from-cyan-500 to-blue-500'" },
  { old: "'from-indigo-500 to-purple-500'", new: "'from-teal-500 to-cyan-500'" },
];

// Files to update
const filesToUpdate = [
  '/components/StudentDashboard.tsx',
  '/components/AdminDashboard.tsx',
  '/components/GetStarted.tsx',
  '/components/NotesSection.tsx',
  '/components/DPPSection.tsx',
  '/components/DPPPractice.tsx',
  '/components/TestSeriesSection.tsx',
  '/components/TestTaking.tsx',
  '/components/ViewResults.tsx',
  '/components/StudentProfile.tsx',
  '/components/StudentRankingsEnhanced.tsx',
  '/components/StudentRating.tsx',
  '/components/AdminTestAnalytics.tsx',
  '/components/StudentAnalytics.tsx',
  '/components/NotificationCenter.tsx',
  '/components/Footer.tsx',
  '/components/TestSeriesContainer.tsx',
];

export { colorReplacements, filesToUpdate };
