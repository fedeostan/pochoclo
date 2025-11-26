# UI Design System Rules

## Overview

This document defines the UI design system for POCHOCLO. Follow these rules to maintain a consistent, minimal, and beautiful user interface.

---

## Core Design Principles

### 1. MINIMAL
- Less is more - remove anything that doesn't serve a purpose
- Embrace whitespace - it creates visual breathing room
- No unnecessary decorations, gradients, or visual noise
- Every element should have a clear purpose

### 2. BEAUTIFUL
- Balanced proportions and consistent spacing
- Soft, rounded corners (never sharp)
- Subtle shadows when elevation is needed
- Typography that's easy to read

### 3. MODERN
- Clean, contemporary aesthetic
- Flat design with subtle depth cues
- Responsive and adaptive layouts
- Smooth, purposeful animations

### 4. LIGHT
- Light backgrounds only (off-white, not pure white)
- Dark text for readability
- Warm, inviting color temperature
- No dark mode (for now)

### 5. SOFT
- Muted, gentle accent colors
- No harsh or vibrant colors
- Smooth color transitions
- Easy on the eyes

---

## Color Palette

### Background Colors
```
background: #FAFAF9  (Warm off-white - main app background)
card:       #FFFFFF  (Pure white - elevated surfaces like cards)
```

### Text Colors
```
foreground:       #1C1917  (Rich dark gray - primary text)
muted-foreground: #78716C  (Medium gray - secondary text)
```

### Primary Color (Soft Sage Green)
```
primary:     #6B8E7B  (Main accent - buttons, links, focus)
primary-50:  #F2F7F4  (Lightest - subtle backgrounds)
primary-100: #E0EBE4  (Hover states)
primary-400: #6B8E7B  (Default)
primary-600: #446152  (Pressed states)
```

### Supporting Colors
```
secondary:   #F5F5F4  (Subtle gray - secondary buttons)
accent:      #FEF3E7  (Soft peach - highlights, badges)
border:      #E7E5E4  (Light gray - borders, dividers)
```

### Semantic Colors
```
destructive: #FEE2E2 / #B91C1C  (Soft red - errors, warnings)
success:     Use primary color
```

---

## Typography

### Hierarchy
| Variant | Size   | Weight    | Usage                    |
|---------|--------|-----------|--------------------------|
| h1      | 36px   | Bold      | Page titles              |
| h2      | 30px   | Semibold  | Section headers          |
| h3      | 24px   | Semibold  | Card titles              |
| h4      | 20px   | Semibold  | Subsection headers       |
| body    | 16px   | Normal    | Body text, paragraphs    |
| lead    | 20px   | Normal    | Intro text, callouts     |
| large   | 18px   | Medium    | Emphasized body text     |
| small   | 14px   | Normal    | Captions, labels         |
| muted   | 14px   | Normal    | Secondary info, hints    |

### Usage
```tsx
import { Text } from "@/components/ui";

<Text variant="h1">Page Title</Text>
<Text variant="body">Regular paragraph text</Text>
<Text variant="muted">Secondary information</Text>
```

---

## Spacing

Use the Tailwind spacing scale consistently:

| Class  | Value | Usage                      |
|--------|-------|----------------------------|
| p-2    | 8px   | Tight internal padding     |
| p-3    | 12px  | Compact padding            |
| p-4    | 16px  | Standard padding           |
| p-6    | 24px  | Comfortable padding        |
| p-8    | 32px  | Generous padding           |
| gap-2  | 8px   | Tight spacing between items|
| gap-4  | 16px  | Standard spacing           |
| gap-6  | 24px  | Comfortable spacing        |

### Margins Between Sections
- Between related items: `mb-2` or `mb-4`
- Between sections: `mb-6` or `mb-8`
- Page padding: `p-6`

---

## Border Radius

| Class      | Value  | Usage                |
|------------|--------|----------------------|
| rounded-sm | 6px    | Small elements       |
| rounded-md | 8px    | Medium elements      |
| rounded-lg | 12px   | Buttons, cards, inputs |
| rounded-full | 9999px | Pills, avatars    |

**Default: Use `rounded-lg` (12px) for most elements**

---

## Components

### Button
```tsx
import { Button } from "@/components/ui";

// Primary action
<Button>Continue</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Outline (less emphasis)
<Button variant="outline">Learn More</Button>

// Ghost (minimal emphasis)
<Button variant="ghost">Skip</Button>

// Destructive (dangerous action)
<Button variant="destructive">Delete</Button>

// With loading state
<Button isLoading>Saving...</Button>
```

### Input
```tsx
import { Input } from "@/components/ui";

// Basic input with label
<Input
  label="Email"
  placeholder="Enter your email"
  keyboardType="email-address"
/>

// Password input (with toggle)
<Input
  label="Password"
  secureTextEntry
/>

// With error
<Input
  label="Username"
  error="Username is already taken"
/>

// With helper text
<Input
  label="Phone"
  helperText="We'll only use this for account recovery"
/>
```

### Card
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Text
```tsx
import { Text } from "@/components/ui";

<Text variant="h1">Heading 1</Text>
<Text variant="h2">Heading 2</Text>
<Text variant="body">Body text</Text>
<Text variant="muted">Secondary text</Text>

// With custom styling
<Text variant="body" className="text-primary text-center">
  Centered primary text
</Text>
```

---

## Layout Guidelines

### Screen Structure
```tsx
<View className="flex-1 bg-background">
  {/* Status bar safe area */}
  <SafeAreaView className="flex-1">
    {/* Screen content with padding */}
    <View className="flex-1 p-6">
      {/* Content here */}
    </View>
  </SafeAreaView>
</View>
```

### Common Patterns

**Centered Content (Auth screens)**
```tsx
<View className="flex-1 items-center justify-center p-6">
  <View className="w-full max-w-sm">
    {/* Form content */}
  </View>
</View>
```

**List with Cards**
```tsx
<ScrollView className="flex-1 p-6">
  <View className="gap-4">
    <Card>{/* Item 1 */}</Card>
    <Card>{/* Item 2 */}</Card>
    <Card>{/* Item 3 */}</Card>
  </View>
</ScrollView>
```

**Form Layout**
```tsx
<View className="gap-4">
  <Input label="Name" />
  <Input label="Email" />
  <Input label="Password" secureTextEntry />
  <Button className="mt-4">Submit</Button>
</View>
```

---

## Do's and Don'ts

### DO
- Use semantic color names (`bg-primary` not `bg-[#6B8E7B]`)
- Maintain consistent spacing (use spacing scale)
- Use the Text component with variants for all text
- Add proper labels and accessibility props
- Keep UI components in `src/components/ui`

### DON'T
- Use pure white (#FFFFFF) as main background (use off-white)
- Use vibrant/harsh colors
- Create custom components without documenting them
- Use inline styles when Tailwind classes exist
- Nest too many containers (keep structure flat)
- Use dark mode colors

### AVOID
- Drop shadows (use sparingly, only for elevation)
- Borders on everything (use for inputs, outlined buttons only)
- Bold text everywhere (reserve for headings)
- Cramped layouts (embrace whitespace)
- Animations without purpose

---

## Importing Components

Always import from the barrel file:
```tsx
// GOOD
import { Button, Input, Text, Card } from "@/components/ui";

// AVOID
import { Button } from "@/components/ui/Button";
```

---

## Creating New Components

When creating new UI components:

1. **Location**: Place in `src/components/ui/`
2. **Documentation**: Add file-level comments explaining purpose
3. **Types**: Export TypeScript interfaces
4. **Variants**: Support common variants (like size, color)
5. **Export**: Add to `src/components/ui/index.ts`
6. **Styling**: Use Tailwind classes, support className prop
7. **Accessibility**: Include proper accessibility props

### Template
```tsx
/**
 * ComponentName
 *
 * Brief description of what this component does.
 *
 * @example
 * <ComponentName>Content</ComponentName>
 */

import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

interface ComponentNameProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export function ComponentName({
  className,
  children,
  ...props
}: ComponentNameProps) {
  return (
    <View className={cn("base-classes", className)} {...props}>
      {children}
    </View>
  );
}

export type { ComponentNameProps };
```

---

## Quick Reference

### Colors
- Background: `bg-background`
- Card: `bg-card`
- Primary: `bg-primary`, `text-primary`
- Muted: `text-muted-foreground`
- Border: `border-border`

### Spacing
- Small: `p-2`, `gap-2`, `m-2`
- Medium: `p-4`, `gap-4`, `m-4`
- Large: `p-6`, `gap-6`, `m-6`

### Typography
- Heading: `<Text variant="h1|h2|h3|h4">`
- Body: `<Text variant="body">`
- Small: `<Text variant="small|muted">`

### Corners
- Default: `rounded-lg`
- Small: `rounded-md`
- Full: `rounded-full`
