# Complete Purple to Teal/Cyan/Blue Replacement Guide

## Comprehensive Find & Replace Patterns

Use these exact patterns in your editor's Find & Replace (Ctrl+H / Cmd+H):

### 3-Color Gradients
```
Find: from-purple-600 via-pink-600 to-indigo-600
Replace: from-cyan-600 via-blue-500 to-teal-600

Find: from-indigo-600 via-purple-600 to-pink-600
Replace: from-teal-600 via-cyan-600 to-blue-500

Find: from-purple-50 via-pink-50 to-indigo-50
Replace: from-cyan-50 via-blue-50 to-teal-50

Find: from-indigo-50 via-purple-50 to-pink-50
Replace: from-teal-50 via-cyan-50 to-blue-50
```

### 2-Color Gradients
```
Find: from-purple-600 to-pink-600
Replace: from-cyan-600 to-blue-500

Find: from-purple-500 to-pink-500
Replace: from-cyan-500 to-blue-500

Find: from-purple-50 to-pink-50
Replace: from-cyan-50 to-blue-50

Find: from-purple-100 to-pink-100
Replace: from-cyan-100 to-blue-100

Find: from-indigo-600 to-purple-600
Replace: from-teal-600 to-cyan-600

Find: from-indigo-500 to-purple-500
Replace: from-teal-500 to-cyan-500

Find: from-indigo-50 to-purple-50
Replace: from-teal-50 to-cyan-50
```

### Solid Backgrounds
```
Find: bg-purple-600
Replace: bg-cyan-600

Find: bg-purple-500
Replace: bg-cyan-500

Find: bg-purple-100
Replace: bg-cyan-100

Find: bg-purple-50
Replace: bg-cyan-50
```

### Text Colors
```
Find: text-purple-600
Replace: text-cyan-600

Find: text-purple-700
Replace: text-cyan-700

Find: text-purple-800
Replace: text-cyan-800

Find: text-purple-100
Replace: text-cyan-100

Find: text-purple-300
Replace: text-cyan-300
```

### Hover States
```
Find: hover:bg-purple-50
Replace: hover:bg-cyan-50

Find: hover:bg-purple-50/50
Replace: hover:bg-cyan-50/50

Find: hover:bg-purple-200
Replace: hover:bg-cyan-200

Find: hover:to-purple-700
Replace: hover:to-cyan-700

Find: hover:from-purple-700
Replace: hover:from-cyan-700
```

### Ring/Focus States
```
Find: focus:ring-purple-500
Replace: focus:ring-cyan-500

Find: focus:border-purple-500
Replace: focus:border-cyan-500

Find: group-focus-within:text-purple-600
Replace: group-focus-within:text-cyan-600
```

### Border Colors
```
Find: border-purple-200
Replace: border-cyan-200

Find: border-purple-300
Replace: border-cyan-300
```

## Files to Update (in priority order)

1. ✅ AdminDashboard.tsx (PARTIAL - needs LayoutDashboard import fix)
2. NotesSection.tsx
3. DPPSection.tsx
4. DPPPractice.tsx
5. TestSeriesSection.tsx
6. TestTaking.tsx
7. ViewResults.tsx
8. StudentProfile.tsx
9. StudentRating.tsx
10. StudentRankingsEnhanced.tsx
11. StudentAnalytics.tsx
12. AdminTestAnalytics.tsx
13. NotificationCenter.tsx
14. Footer.tsx

## Special Cases

### Keeping certain purple/pink gradients:
Some components might intentionally use purple for specific features like:
- Award/Trophy icons (can keep yellow-orange)
- Specific subject colors
- Notification types

### Recommended color mapping by feature:
- **Primary Actions**: teal-600 to cyan-600
- **Success**: green-500 to emerald-500  
- **Warning**: yellow-500 to orange-500
- **Info**: cyan-500 to-blue-500
- **Danger**: red-500 to rose-500

## Quick Terminal Commands (if using sed)

```bash
# For macOS/BSD sed:
find ./components -name "*.tsx" -exec sed -i '' 's/from-purple-600 via-pink-600 to-indigo-600/from-cyan-600 via-blue-500 to-teal-600/g' {} +

# For Linux sed:
find ./components -name "*.tsx" -exec sed -i 's/from-purple-600 via-pink-600 to-indigo-600/from-cyan-600 via-blue-500 to-teal-600/g' {} +
```

## Testing Checklist

After replacements:
- [ ] All pages load without errors
- [ ] Gradients render correctly
- [ ] Hover states work
- [ ] Focus states are visible
- [ ] No color class typos
- [ ] Consistent color scheme across app
