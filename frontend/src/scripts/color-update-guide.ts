/**
 * UJAAS Color Palette Update Script
 * This script provides find-and-replace patterns for updating all remaining components
 * from indigo/purple/pink to teal/cyan/blue palette
 */

export const colorMappings = {
  // ===== GRADIENT REPLACEMENTS =====
  
  // 3-Color Gradients
  'from-indigo-600 via-purple-600 to-pink-600': 'from-teal-600 via-cyan-600 to-blue-500',
  'from-purple-600 via-pink-600 to-indigo-600': 'from-cyan-600 via-blue-500 to-teal-600',
  'from-indigo-50 via-purple-50 to-pink-50': 'from-teal-50 via-cyan-50 to-blue-50',
  'from-purple-50 via-pink-50 to-indigo-50': 'from-cyan-50 via-blue-50 to-teal-50',
  'from-indigo-100 via-purple-100 to-pink-100': 'from-teal-100 via-cyan-100 to-blue-100',
  
  // 2-Color Gradients
  'from-indigo-600 to-purple-600': 'from-teal-600 to-cyan-600',
  'from-purple-600 to-pink-600': 'from-cyan-600 to-blue-500',
  'from-indigo-500 to-purple-500': 'from-teal-500 to-cyan-500',
  'from-purple-500 to-pink-500': 'from-cyan-500 to-blue-500',
  'from-indigo-50 to-purple-50': 'from-teal-50 to-cyan-50',
  'from-purple-50 to-pink-50': 'from-cyan-50 to-blue-50',
  'from-indigo-100 to-purple-100': 'from-teal-100 to-cyan-100',
  'from-purple-100 to-pink-100': 'from-cyan-100 to-blue-100',
  'from-blue-50 to-indigo-50': 'from-teal-50 to-cyan-50',
  
  // ===== BACKGROUND COLORS =====
  'bg-indigo-600': 'bg-teal-600',
  'bg-purple-600': 'bg-cyan-600',
  'bg-pink-600': 'bg-blue-500',
  'bg-indigo-500': 'bg-teal-500',
  'bg-purple-500': 'bg-cyan-500',
  'bg-pink-500': 'bg-blue-500',
  'bg-indigo-100': 'bg-teal-100',
  'bg-purple-100': 'bg-cyan-100',
  'bg-pink-100': 'bg-blue-100',
  'bg-indigo-50': 'bg-teal-50',
  'bg-purple-50': 'bg-cyan-50',
  'bg-pink-50': 'bg-blue-50',
  'bg-indigo-200': 'bg-teal-200',
  
  // ===== TEXT COLORS =====
  'text-indigo-600': 'text-teal-600',
  'text-purple-600': 'text-cyan-600',
  'text-pink-600': 'text-blue-500',
  'text-indigo-700': 'text-teal-700',
  'text-purple-700': 'text-cyan-700',
  'text-indigo-800': 'text-teal-800',
  'text-purple-800': 'text-cyan-800',
  'text-indigo-100': 'text-teal-100',
  'text-purple-100': 'text-cyan-100',
  'text-indigo-300': 'text-teal-300',
  
  // ===== BORDER COLORS =====
  'border-indigo-200': 'border-teal-200',
  'border-purple-200': 'border-cyan-200',
  'border-pink-200': 'border-blue-200',
  'border-indigo-300': 'border-teal-300',
  'border-purple-300': 'border-cyan-300',
  
  // ===== RING/FOCUS COLORS =====
  'ring-indigo-600': 'ring-teal-600',
  'ring-purple-600': 'ring-cyan-600',
  'ring-indigo-500': 'ring-teal-500',
  'focus:ring-indigo-500': 'focus:ring-teal-500',
  'focus:border-indigo-500': 'focus:border-teal-500',
  
  // ===== HOVER STATES =====
  'hover:text-indigo-600': 'hover:text-teal-600',
  'hover:text-indigo-700': 'hover:text-teal-700',
  'hover:text-purple-600': 'hover:text-cyan-600',
  'hover:bg-indigo-50': 'hover:bg-teal-50',
  'hover:bg-indigo-200': 'hover:bg-teal-200',
  'hover:bg-purple-50': 'hover:bg-cyan-50',
  'hover:bg-purple-50/50': 'hover:bg-cyan-50/50',
  'hover:from-indigo-700 hover:to-purple-700': 'hover:from-teal-700 hover:to-cyan-700',
  'hover:from-purple-700 hover:to-pink-700': 'hover:from-cyan-700 hover:to-blue-600',
  'hover:shadow-purple-500/50': 'hover:shadow-cyan-500/50',
  'hover:shadow-indigo-500/50': 'hover:shadow-teal-500/50',
  
  // ===== GROUP STATES =====
  'group-focus-within:text-indigo-600': 'group-focus-within:text-teal-600',
  'group-focus-within:text-purple-600': 'group-focus-within:text-cyan-600',
  'group-hover:text-indigo-600': 'group-hover:text-teal-600',
  'group-hover:bg-indigo-50': 'group-hover:bg-teal-50',
};

// Components that still need updates
export const pendingComponents = [
  '/components/AdminDashboard.tsx',
  '/components/NotesSection.tsx',
  '/components/DPPSection.tsx',
  '/components/DPPPractice.tsx',
  '/components/TestSeriesSection.tsx',
  '/components/TestTaking.tsx',
  '/components/ViewResults.tsx',
  '/components/StudentProfile.tsx',
  '/components/AdminTestAnalytics.tsx',
  '/components/StudentAnalytics.tsx',
  '/components/NotificationCenter.tsx',
  '/components/TestSeriesContainer.tsx',
];

// Instructions for batch replacement:
// 1. Open each file in pendingComponents
// 2. Use Find & Replace (Ctrl+H or Cmd+H)
// 3. For each key-value pair in colorMappings:
//    - Find: key
//    - Replace with: value
// 4. Save the file

console.log('Color migration patterns ready!');
console.log(`Total mappings: ${Object.keys(colorMappings).length}`);
console.log(`Pending components: ${pendingComponents.length}`);
