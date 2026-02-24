#!/usr/bin/env python3
"""
Complete UJAAS Color Palette Migration Script
Replaces ALL indigo/purple/pink colors with teal/cyan/blue palette
"""

import re
import os
from pathlib import Path

# Define color mappings
COLOR_MAPPINGS = [
    # 3-color gradients
    ('from-purple-600 via-pink-600 to-indigo-600', 'from-cyan-600 via-blue-500 to-teal-600'),
    ('from-indigo-600 via-purple-600 to-pink-600', 'from-teal-600 via-cyan-600 to-blue-500'),
    ('from-blue-600 via-indigo-600 to-purple-600', 'from-teal-600 via-cyan-600 to-blue-500'),
    ('from-indigo-50 via-purple-50 to-pink-50', 'from-teal-50 via-cyan-50 to-blue-50'),
    
    # 2-color gradients - purple/pink
    ('from-purple-600 to-pink-600', 'from-cyan-600 to-blue-500'),
    ('from-purple-500 to-pink-500', 'from-cyan-500 to-blue-500'),
    ('from-purple-100 to-pink-100', 'from-cyan-100 to-blue-100'),
    ('from-purple-50 to-pink-50', 'from-cyan-50 to-blue-50'),
    
    # 2-color gradients - indigo/purple
    ('from-indigo-600 to-purple-600', 'from-teal-600 to-cyan-600'),
    ('from-indigo-700 to-purple-700', 'from-teal-700 to-cyan-700'),
    ('from-indigo-500 to-purple-500', 'from-teal-500 to-cyan-500'),
    ('from-indigo-50 to-purple-50', 'from-teal-50 to-cyan-50'),
    
    # Hover states - combined
    ('hover:from-indigo-700 hover:to-purple-700', 'hover:from-teal-700 hover:to-cyan-700'),
    
    # Red/pink gradients (preserve some pink as rose)
    ('from-red-500 to-pink-500', 'from-red-500 to-rose-500'),
    ('from-red-50 to-pink-50', 'from-red-50 to-rose-50'),
    
    # Solid backgrounds - purple
    ('bg-purple-600', 'bg-cyan-600'),
    ('bg-purple-500', 'bg-cyan-500'),
    ('bg-purple-300', 'bg-cyan-300'),
    ('bg-purple-200', 'bg-cyan-200'),
    ('bg-purple-100', 'bg-cyan-100'),
    ('bg-purple-50', 'bg-cyan-50'),
    
    # Solid backgrounds - indigo
    ('bg-indigo-600', 'bg-teal-600'),
    ('bg-indigo-500', 'bg-teal-500'),
    ('bg-indigo-200', 'bg-teal-200'),
    ('bg-indigo-100', 'bg-teal-100'),
    ('bg-indigo-50', 'bg-teal-50'),
    
    # Text colors - purple
    ('text-purple-800', 'text-cyan-800'),
    ('text-purple-700', 'text-cyan-700'),
    ('text-purple-600', 'text-cyan-600'),
    ('text-purple-500', 'text-cyan-500'),
    ('text-purple-400', 'text-cyan-400'),
    ('text-purple-100', 'text-cyan-100'),
    
    # Text colors - indigo  
    ('text-indigo-800', 'text-teal-800'),
    ('text-indigo-600', 'text-teal-600'),
    ('text-indigo-100', 'text-teal-100'),
    
    # Border colors - purple
    ('border-purple-600', 'border-cyan-600'),
    ('border-purple-500', 'border-cyan-500'),
    ('border-purple-400', 'border-cyan-400'),
    ('border-purple-300', 'border-cyan-300'),
    ('border-purple-200', 'border-cyan-200'),
    
    # Border colors - indigo
    ('border-indigo-600', 'border-teal-600'),
    ('border-indigo-500', 'border-teal-500'),
    ('border-indigo-300', 'border-teal-300'),
    ('border-indigo-200', 'border-teal-200'),
    
    # Hover states - purple
    ('hover:bg-purple-50', 'hover:bg-cyan-50'),
    ('hover:bg-purple-200', 'hover:bg-cyan-200'),
    ('hover:text-purple-600', 'hover:text-cyan-600'),
    
    # Hover states - indigo
    ('hover:bg-indigo-50', 'hover:bg-teal-50'),
    ('hover:bg-indigo-200', 'hover:bg-teal-200'),
    ('hover:border-indigo-300', 'hover:border-teal-300'),
    ('hover:text-indigo-600', 'hover:text-teal-600'),
    
    # Ring/focus colors
    ('ring-purple-600', 'ring-cyan-600'),
    ('ring-purple-500', 'ring-cyan-500'),
    ('ring-indigo-600', 'ring-teal-600'),
    ('ring-indigo-500', 'ring-teal-500'),
    ('focus:ring-purple-500', 'focus:ring-cyan-500'),
    ('focus:ring-indigo-500', 'focus:ring-teal-500'),
    ('focus:border-purple-500', 'focus:border-cyan-500'),
    ('focus:border-indigo-500', 'focus:border-teal-500'),
    
    # Group states
    ('group-focus-within:text-purple-600', 'group-focus-within:text-cyan-600'),
    ('group-focus-within:text-indigo-600', 'group-focus-within:text-teal-600'),
    ('group-hover:bg-indigo-50', 'group-hover:bg-teal-50'),
    ('group-hover:bg-indigo-200', 'group-hover:bg-teal-200'),
    ('group-hover:text-indigo-600', 'group-hover:text-teal-600'),
    
    # Special variations
    ('to-purple-50', 'to-cyan-50'),
    ('via-purple-50', 'via-cyan-50'),
    ('via-purple-600', 'via-cyan-600'),
    ('via-pink-600', 'via-blue-500'),
]

def update_file(file_path):
    """Update a single file with new color scheme"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = 0
        
        # Apply all color mappings
        for old_color, new_color in COLOR_MAPPINGS:
            if old_color in content:
                content = content.replace(old_color, new_color)
                changes_made += content.count(new_color) - original_content.count(new_color)
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Updated: {file_path} ({changes_made} changes)")
            return True
        else:
            print(f"⏭️  Skipped: {file_path} (no changes needed)")
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    """Main migration function"""
    print("🎨 UJAAS Complete Color Palette Migration")
    print("=" * 60)
    print("Converting: indigo/purple/pink → teal/cyan/blue")
    print("=" * 60)
    
    # Find all TypeScript/TSX files in components directory
    components_dir = Path('./components')
    if not components_dir.exists():
        print(f"❌ Components directory not found: {components_dir}")
        return
    
    tsx_files = list(components_dir.glob('*.tsx')) + list(components_dir.glob('*.ts'))
    
    if not tsx_files:
        print("❌ No TypeScript files found")
        return
    
    print(f"📁 Found {len(tsx_files)} files to process\n")
    
    updated_count = 0
    skipped_count = 0
    
    for file_path in sorted(tsx_files):
        if update_file(file_path):
            updated_count += 1
        else:
            skipped_count += 1
    
    print("\n" + "=" * 60)
    print(f"✨ Migration Complete!")
    print(f"   ✅ Updated: {updated_count} files")
    print(f"   ⏭️  Skipped: {skipped_count} files")
    print(f"   📊 Total: {len(tsx_files)} files")
    print("=" * 60)
    print("\n🎉 Your UJAAS website now uses the teal/cyan/blue color palette!")

if __name__ == '__main__':
    main()
