#!/bin/bash
# Color Replacement Script for UJAAS Website
# Old: Indigo-Purple-Pink palette
# New: Teal-Cyan-Blue-Yellow palette

# Gradient replacements
find . -name "*.tsx" -type f -exec sed -i '' \
  -e 's/from-indigo-600 via-purple-600 to-pink-600/from-teal-600 via-cyan-600 to-blue-500/g' \
  -e 's/from-indigo-600 to-purple-600/from-teal-600 to-cyan-600/g' \
  -e 's/from-purple-600 to-pink-600/from-cyan-600 to-blue-500/g' \
  -e 's/from-purple-500 to-pink-500/from-cyan-500 to-blue-500/g' \
  -e 's/from-indigo-500 to-purple-500/from-teal-500 to-cyan-500/g' \
  {} \;

# Background colors
find . -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-indigo-600/bg-teal-600/g' \
  -e 's/bg-purple-600/bg-cyan-600/g' \
  -e 's/bg-pink-600/bg-blue-500/g' \
  -e 's/bg-indigo-100/bg-teal-100/g' \
  -e 's/bg-purple-100/bg-cyan-100/g' \
  -e 's/bg-pink-100/bg-blue-100/g' \
  -e 's/bg-indigo-50/bg-teal-50/g' \
  -e 's/bg-purple-50/bg-cyan-50/g' \
  -e 's/bg-pink-50/bg-blue-50/g' \
  {} \;

# Text colors
find . -name "*.tsx" -type f -exec sed -i '' \
  -e 's/text-indigo-600/text-teal-600/g' \
  -e 's/text-purple-600/text-cyan-600/g' \
  -e 's/text-pink-600/text-blue-500/g' \
  -e 's/text-indigo-100/text-teal-100/g' \
  -e 's/text-purple-100/text-cyan-100/g' \
  -e 's/text-pink-100/text-blue-100/g' \
  {} \;

# Border colors
find . -name "*.tsx" -type f -exec sed -i '' \
  -e 's/border-indigo-200/border-teal-200/g' \
  -e 's/border-purple-200/border-cyan-200/g' \
  -e 's/border-pink-200/border-blue-200/g' \
  {} \;

# Hover states
find . -name "*.tsx" -type f -exec sed -i '' \
  -e 's/hover:text-indigo-600/hover:text-teal-600/g' \
  -e 's/hover:text-indigo-700/hover:text-teal-700/g' \
  -e 's/hover:from-indigo-700 hover:to-purple-700/hover:from-teal-700 hover:to-cyan-700/g' \
  -e 's/hover:from-purple-700 hover:to-pink-700/hover:from-cyan-700 hover:to-blue-600/g' \
  {} \;

echo "Color replacement complete!"
