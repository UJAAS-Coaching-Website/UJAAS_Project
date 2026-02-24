# Color Palette Replacements

## Old Palette (Indigo-Purple-Pink)
- Primary: Indigo (#4F46E5)
- Secondary: Purple (#9333EA)
- Accent: Pink (#DB2777)
- Info: Blue (#2563EB)

## New Palette (Teal-Cyan-Blue-Yellow)
Based on the provided image:
- Primary: Teal (#14B8A6 / teal-500, #0D9488 / teal-600)
- Secondary: Cyan (#06B6D4 / cyan-500, #0891B2 / cyan-600)
- Tertiary: Light Blue (#3B82F6 / blue-500, #2563EB / blue-600)
- Accent: Yellow (#FACC15 / yellow-400, #EAB308 / yellow-500)

## Replacement Rules

### Main Gradients:
- `from-indigo-600 via-purple-600 to-pink-600` → `from-teal-600 via-cyan-600 to-blue-500`
- `from-indigo-600 to-purple-600` → `from-teal-600 to-cyan-600`
- `from-purple-600 to-pink-600` → `from-cyan-600 to-blue-500`
- `from-indigo-600 via-purple-600 to-pink-600` → `from-teal-600 via-cyan-600 to-blue-500`

### Backgrounds:
- `bg-indigo-600` → `bg-teal-600`
- `bg-purple-600` → `bg-cyan-600`
- `bg-pink-600` → `bg-blue-500`
- `bg-indigo-100` → `bg-teal-100`
- `bg-purple-100` → `bg-cyan-100`
- `bg-pink-100` → `bg-blue-100`
- `bg-indigo-50` → `bg-teal-50`
- `bg-purple-50` → `bg-cyan-50`
- `bg-pink-50` → `bg-blue-50`

### Text Colors:
- `text-indigo-600` → `text-teal-600`
- `text-purple-600` → `text-cyan-600`
- `text-pink-600` → `text-blue-500`
- `text-indigo-100` → `text-teal-100`
- `text-purple-100` → `text-cyan-100`

### Borders:
- `border-indigo-200` → `border-teal-200`
- `border-purple-200` → `border-cyan-200`
- `border-pink-200` → `border-blue-200`

###  Hover States:
- `hover:text-indigo-600` → `hover:text-teal-600`
- `hover:bg-indigo-200` → `hover:bg-teal-200`
