#!/bin/bash

# Complete Color Migration Script
# Replaces all indigo/purple/pink colors with teal/cyan/blue across entire project

echo "🎨 Starting Complete Color Palette Migration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find all TypeScript/TSX files
FILES=$(find ./components -name "*.tsx" -o -name "*.ts")

for file in $FILES; do
    echo "Processing: $file"
    
    # 3-Color Gradients
    sed -i'' -e 's/from-purple-600 via-pink-600 to-indigo-600/from-cyan-600 via-blue-500 to-teal-600/g' "$file"
    sed -i'' -e 's/from-indigo-600 via-purple-600 to-pink-600/from-teal-600 via-cyan-600 to-blue-500/g' "$file"
    sed -i'' -e 's/from-purple-50 via-pink-50 to-indigo-50/from-cyan-50 via-blue-50 to-teal-50/g' "$file"
    sed -i'' -e 's/from-indigo-50 via-purple-50 to-pink-50/from-teal-50 via-cyan-50 to-blue-50/g' "$file"
    sed -i'' -e 's/from-blue-600 via-indigo-600 to-purple-600/from-teal-600 via-cyan-600 to-blue-500/g' "$file"
    
    # 2-Color Gradients - Purple/Pink
    sed -i'' -e 's/from-purple-600 to-pink-600/from-cyan-600 to-blue-500/g' "$file"
    sed -i'' -e 's/from-purple-500 to-pink-500/from-cyan-500 to-blue-500/g' "$file"
    sed -i'' -e 's/from-purple-100 to-pink-100/from-cyan-100 to-blue-100/g' "$file"
    sed -i'' -e 's/from-purple-50 to-pink-50/from-cyan-50 to-blue-50/g' "$file"
    
    # 2-Color Gradients - Indigo/Purple
    sed -i'' -e 's/from-indigo-600 to-purple-600/from-teal-600 to-cyan-600/g' "$file"
    sed -i'' -e 's/from-indigo-700 to-purple-700/from-teal-700 to-cyan-700/g' "$file"
    sed -i'' -e 's/from-indigo-500 to-purple-500/from-teal-500 to-cyan-500/g' "$file"
    sed -i'' -e 's/from-indigo-50 to-purple-50/from-teal-50 to-cyan-50/g' "$file"
    
    # 2-Color Gradients - Blue/Indigo
    sed -i'' -e 's/from-blue-50 to-indigo-50/from-teal-50 to-cyan-50/g' "$file"
    sed -i'' -e 's/from-blue-500 to-indigo-500/from-teal-500 to-cyan-500/g' "$file"
    
    # Single Color Gradients
    sed -i'' -e 's/from-blue-400 to-indigo-500/from-teal-500 to-cyan-500/g' "$file"
    sed -i'' -e 's/from-red-500 to-pink-500/from-red-500 to-rose-500/g' "$file"
    
    # Solid Background Colors - Purple
    sed -i'' -e 's/bg-purple-600/bg-cyan-600/g' "$file"
    sed -i'' -e 's/bg-purple-500/bg-cyan-500/g' "$file"
    sed -i'' -e 's/bg-purple-100/bg-cyan-100/g' "$file"
    sed -i'' -e 's/bg-purple-50/bg-cyan-50/g' "$file"
    sed -i'' -e 's/bg-purple-300/bg-cyan-300/g' "$file"
    
    # Solid Background Colors - Indigo
    sed -i'' -e 's/bg-indigo-600/bg-teal-600/g' "$file"
    sed -i'' -e 's/bg-indigo-500/bg-teal-500/g' "$file"
    sed -i'' -e 's/bg-indigo-200/bg-teal-200/g' "$file"
    sed -i'' -e 's/bg-indigo-100/bg-teal-100/g' "$file"
    sed -i'' -e 's/bg-indigo-50/bg-teal-50/g' "$file"
    
    # Text Colors - Purple
    sed -i'' -e 's/text-purple-800/text-cyan-800/g' "$file"
    sed -i'' -e 's/text-purple-700/text-cyan-700/g' "$file"
    sed -i'' -e 's/text-purple-600/text-cyan-600/g' "$file"
    sed -i'' -e 's/text-purple-100/text-cyan-100/g' "$file"
    
    # Text Colors - Indigo
    sed -i'' -e 's/text-indigo-800/text-teal-800/g' "$file"
    sed -i'' -e 's/text-indigo-600/text-teal-600/g' "$file"
    sed -i'' -e 's/text-indigo-100/text-teal-100/g' "$file"
    
    # Border Colors - Purple
    sed -i'' -e 's/border-purple-500/border-cyan-500/g' "$file"
    sed -i'' -e 's/border-purple-300/border-cyan-300/g' "$file"
    sed -i'' -e 's/border-purple-200/border-cyan-200/g' "$file"
    
    # Border Colors - Indigo
    sed -i'' -e 's/border-indigo-600/border-teal-600/g' "$file"
    sed -i'' -e 's/border-indigo-500/border-teal-500/g' "$file"
    sed -i'' -e 's/border-indigo-300/border-teal-300/g' "$file"
    sed -i'' -e 's/border-indigo-200/border-teal-200/g' "$file"
    
    # Hover States - Purple
    sed -i'' -e 's/hover:bg-purple-50/hover:bg-cyan-50/g' "$file"
    sed -i'' -e 's/hover:bg-purple-50\/50/hover:bg-cyan-50\/50/g' "$file"
    sed -i'' -e 's/hover:bg-purple-200/hover:bg-cyan-200/g' "$file"
    sed -i'' -e 's/hover:to-purple-700/hover:to-cyan-700/g' "$file"
    sed -i'' -e 's/hover:from-purple-700/hover:from-cyan-700/g' "$file"
    
    # Hover States - Indigo
    sed -i'' -e 's/hover:bg-indigo-50/hover:bg-teal-50/g' "$file"
    sed -i'' -e 's/hover:bg-indigo-200/hover:bg-teal-200/g' "$file"
    sed -i'' -e 's/hover:border-indigo-300/hover:border-teal-300/g' "$file"
    sed -i'' -e 's/hover:to-indigo-700/hover:to-teal-700/g' "$file"
    sed -i'' -e 's/hover:from-indigo-700/hover:from-teal-700/g' "$file"
    
    # Ring/Focus Colors
    sed -i'' -e 's/ring-purple-600/ring-cyan-600/g' "$file"
    sed -i'' -e 's/ring-purple-500/ring-cyan-500/g' "$file"
    sed -i'' -e 's/ring-indigo-600/ring-teal-600/g' "$file"
    sed -i'' -e 's/ring-indigo-500/ring-teal-500/g' "$file"
    sed -i'' -e 's/focus:ring-purple-500/focus:ring-cyan-500/g' "$file"
    sed -i'' -e 's/focus:ring-indigo-500/focus:ring-teal-500/g' "$file"
    sed -i'' -e 's/focus:border-purple-500/focus:border-cyan-500/g' "$file"
    sed -i'' -e 's/focus:border-indigo-500/focus:border-teal-500/g' "$file"
    
    # Group States
    sed -i'' -e 's/group-focus-within:text-purple-600/group-focus-within:text-cyan-600/g' "$file"
    sed -i'' -e 's/group-focus-within:text-indigo-600/group-focus-within:text-teal-600/g' "$file"
    sed -i'' -e 's/group-hover:bg-indigo-50/group-hover:bg-teal-50/g' "$file"
    sed -i'' -e 's/group-hover:bg-indigo-200/group-hover:bg-teal-200/g' "$file"
    
    # Pink to Rose/Blue (context-dependent)
    sed -i'' -e 's/from-pink-500 to-rose-500/from-rose-500 to-red-500/g' "$file"
    sed -i'' -e 's/hover:text-pink-400/hover:text-rose-400/g' "$file"
    sed -i'' -e 's/from-red-500 to-pink-500/from-red-500 to-rose-500/g' "$file"
    sed -i'' -e 's/from-pink-50 to-rose-50/from-rose-50 to-red-50/g' "$file"
    
done

echo "✅ Color migration complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Cleaning up backup files..."
find ./components -name "*.tsx-e" -delete
find ./components -name "*.ts-e" -delete

echo "✨ All done! Your UJAAS website now uses the teal/cyan/blue palette!"
