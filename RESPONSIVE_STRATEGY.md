# Responsive Strategy

## Goal

Keep the current desktop website design as the source of truth, and create rough mobile and tablet layouts only to define how elements should be placed on smaller devices.

This approach avoids redesigning the whole product again while still giving enough direction to make the frontend responsive.

## Why This Approach Works

- The desktop design has already evolved beyond the original Figma.
- Rebuilding the whole design system first would slow everything down.
- Rough mobile and tablet layouts are enough to guide structure, stacking, spacing, and visibility decisions.
- We can preserve the current desktop look while improving smaller screen behavior.

## Core Principle

Use the existing website for:

- colors
- typography
- component styles
- spacing language
- visual identity

Use the rough mobile and tablet design only for:

- element placement
- stacking order
- section structure
- font size hierarchy
- button and input sizing
- hide/show behavior

Do not spend time polishing animations, exact colors, or fine visual details in the rough mobile and tablet design.

## Recommended Workflow

### 1. Freeze Desktop First

Before starting responsiveness work, treat the current desktop version as the baseline.

If desktop keeps changing while mobile and tablet are being adjusted, the responsive work will become unstable and repetitive.

### 2. Create Rough Mobile and Tablet Layouts

Design rough layouts screen by screen for:

- mobile
- tablet

These layouts only need to answer:

- What should stack?
- What should remain side by side?
- What should become full width?
- What should be hidden, collapsed, or simplified?
- How much spacing should sections roughly have?

### 3. Work Section by Section

Do not try to make the whole website responsive in one pass.

Follow this order:

1. navbar/header
2. hero section
3. feature or content sections
4. cards and grids
5. forms
6. footer

This keeps the work controlled and reduces layout regressions.

### 4. Fix Layout Before Styling

Most responsiveness issues come from layout rigidity, not colors or decoration.

Check for:

- fixed widths
- fixed heights
- large horizontal padding
- absolute positioning
- large gaps
- text that does not wrap well
- multi-column layouts that should stack on smaller screens

Fix those first using responsive layout techniques. After that, adjust visual spacing and typography where needed.

### 5. Reuse Existing Styles

Do not create a separate mobile design language.

Keep using the current:

- color palette
- fonts
- border radius
- shadows
- button styles
- card styles

The responsive version should feel like the same product, not a different redesign.

## Suggested Breakpoints

Start with simple breakpoints and keep them consistent across the project:

```css
/* Mobile */
@media (max-width: 767px) {}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {}

/* Desktop */
@media (min-width: 1024px) {}
```

You can refine later if specific sections need adjustment, but avoid too many breakpoints in the beginning.

## What to Prioritize in Code

### Prefer Flexible Units

Use:

- `%`
- `rem`
- `vw` when appropriate
- `clamp()` for scalable typography and spacing
- `max-width`
- `min-height`

Avoid relying too much on:

- fixed `px` widths
- fixed `px` heights
- hardcoded horizontal spacing that only works on desktop

### Prefer Flexible Layout Systems

Use:

- `flex`
- `flex-wrap`
- `grid`
- `grid-template-columns`
- `gap`

Common responsive patterns:

- two columns on desktop -> one column on mobile
- card grid on desktop -> two columns on tablet -> one column on mobile
- horizontal button groups -> wrapped or stacked buttons
- side-by-side image/text -> stacked content

### Be Careful With Absolute Positioning

If a section relies heavily on `position: absolute`, it will often break on smaller screens.

Where possible:

- reduce absolute positioning
- anchor decorative elements safely
- let important content remain in normal document flow

## Practical Refactor Rules

When updating a section, ask:

1. Does anything overflow horizontally?
2. Are text blocks still readable?
3. Are buttons large enough to tap?
4. Is spacing too compressed or too wide?
5. Does the content order still make sense on mobile?
6. Should this layout stack earlier on tablet?

If the answer is unclear, use the rough mobile or tablet design to decide placement.

## What the Rough Design Must Show

If you are preparing rough layouts for implementation, make sure they clearly show:

- which elements stack
- which elements remain in a row
- what gets hidden or collapsed
- alignment changes
- approximate spacing
- image and text ordering

Even simple wireframes are enough if these decisions are visible.

## Best Implementation Mindset

Do not think of this as "making pages responsive."

Think of it as:

- stabilizing reusable layout patterns
- fixing sections one at a time
- preserving the desktop design
- adapting structure for smaller screens

This mindset prevents random media query patches and keeps the code maintainable.

## Common Mistakes to Avoid

- trying to redesign desktop and mobile at the same time
- writing too many one-off media queries
- forcing desktop spacing onto mobile
- keeping fixed heights for content sections
- depending on screenshots without layout notes
- patching every page individually instead of fixing shared components

## Ideal Collaboration Workflow

The most effective way to handle this project is:

1. keep the current desktop website as reference
2. create rough mobile and tablet layouts
3. review one section at a time
4. implement responsive behavior without changing desktop unnecessarily
5. test on real viewport widths and fix overflow, spacing, and alignment issues

## Final Advice

This approach is not just acceptable, it is one of the most practical ways to recover responsiveness after the frontend has drifted from the original design source.

The goal is not to make the mobile and tablet design perfect first.

The goal is to provide enough structural guidance so the existing website can be made responsive in a controlled and predictable way.
