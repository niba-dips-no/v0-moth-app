# Målerjakt (Moth Hunt) - Visual Design & UI Implementation Guide

## Design System Overview

The Målerjakt app uses a modern, clean design system built on **shadcn/ui** components with **Tailwind CSS** for styling. The design prioritizes mobile-first responsive design with a nature-inspired color palette suitable for a citizen science application.

---

## Color Palette & Theme

### Primary Colors
\`\`\`css
/* Green-based primary palette for nature/science theme */
--primary: 142.1 76.2% 36.3%;           /* Forest Green #22c55e */
--primary-foreground: 355.7 100% 97.3%; /* Near White */

/* Secondary neutral palette */
--secondary: 210 40% 96.1%;              /* Light Gray */
--secondary-foreground: 222.2 47.4% 11.2%; /* Dark Gray */
\`\`\`

### Background & Surface Colors
\`\`\`css
--background: 0 0% 100%;                 /* Pure White */
--foreground: 222.2 84% 4.9%;           /* Near Black */
--card: 0 0% 100%;                      /* White Cards */
--card-foreground: 222.2 84% 4.9%;     /* Dark Text */
--muted: 210 40% 96.1%;                 /* Light Gray Backgrounds */
--muted-foreground: 215.4 16.3% 46.9%; /* Muted Text */
\`\`\`

### Status Colors
\`\`\`css
--destructive: 0 84.2% 60.2%;           /* Red for errors */
--destructive-foreground: 210 40% 98%;  /* White text on red */
\`\`\`

### Dark Mode Support
The app includes full dark mode support with inverted color values while maintaining contrast ratios.

---

## Typography

### Font Family
- **Primary:** Inter (Google Fonts)
- **Fallback:** Arial, Helvetica, sans-serif

### Font Scales
\`\`\`css
/* Heading hierarchy */
.text-3xl { font-size: 1.875rem; }  /* Main page titles */
.text-2xl { font-size: 1.5rem; }    /* Section headers */
.text-lg { font-size: 1.125rem; }   /* Card titles */

/* Body text */
.text-base { font-size: 1rem; }     /* Default body text */
.text-sm { font-size: 0.875rem; }   /* Secondary text */
.text-xs { font-size: 0.75rem; }    /* Captions, metadata */
\`\`\`

---

## Layout System

### Container Structure
\`\`\`tsx
// Standard page layout
<main className="flex min-h-screen flex-col items-center p-4">
  <div className="w-full max-w-md"> {/* Mobile-first container */}
    {/* Page content */}
  </div>
</main>
\`\`\`

### Responsive Breakpoints
- **Mobile:** Default (up to 768px)
- **Tablet:** `md:` (768px+)
- **Desktop:** `lg:` (1024px+)
- **Large:** `xl:` (1280px+)

### Grid Systems
\`\`\`tsx
// Two-column button grid (common pattern)
<div className="grid grid-cols-2 gap-4">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

// Three-column stats grid
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Stat cards */}
</div>
\`\`\`

---

## Component Design Patterns

### 1. Card Components
**Primary container for content sections**

\`\`\`tsx
<Card className="w-full">
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent className="p-4">
    {/* Main content */}
  </CardContent>
  <CardFooter className="flex justify-between">
    {/* Action buttons */}
  </CardFooter>
</Card>
\`\`\`

**Visual Characteristics:**
- White background with subtle border
- Rounded corners (`border-radius: 0.5rem`)
- Subtle shadow for depth
- Consistent padding: `p-4` (16px)

### 2. Button Hierarchy

#### Primary Buttons
\`\`\`tsx
<Button className="gap-2">
  <Icon className="h-4 w-4" />
  Primary Action
</Button>
\`\`\`
- Green background (`--primary`)
- White text
- Used for main actions (Submit, Take Photo)

#### Secondary Buttons
\`\`\`tsx
<Button variant="outline" className="gap-2">
  <Icon className="h-4 w-4" />
  Secondary Action
</Button>
\`\`\`
- White background with green border
- Green text
- Used for alternative actions (Cancel, Back)

#### Icon Buttons
\`\`\`tsx
<Button variant="outline" size="icon">
  <Icon className="h-4 w-4" />
</Button>
\`\`\`
- Square aspect ratio
- Used for close, edit, delete actions

### 3. Navigation Patterns

#### Home Screen Grid
\`\`\`tsx
<Card className="w-full">
  <CardContent className="grid grid-cols-2 gap-4 p-4">
    <Button variant="outline" className="flex flex-col gap-2 h-24">
      <Icon className="h-6 w-6" />
      <span>Action Label</span>
    </Button>
    {/* Repeat for other actions */}
  </CardContent>
</Card>
\`\`\`

**Visual Characteristics:**
- 2x2 grid on mobile, expandable on larger screens
- Square buttons with vertical icon + text layout
- Consistent height: `h-24` (96px)
- Icons: `h-6 w-6` (24px)

### 4. Form Components

#### Input Fields
\`\`\`tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input
    id="field"
    type="text"
    placeholder="Placeholder text"
    className="w-full"
  />
</div>
\`\`\`

#### Textarea
\`\`\`tsx
<Textarea
  placeholder="Add a comment..."
  className="resize-none"
  rows={3}
/>
\`\`\`

**Visual Characteristics:**
- Consistent border radius and padding
- Focus states with green accent
- Proper spacing with `space-y-2` (8px)

### 5. Image Display Patterns

#### Full-width Image with Overlay
\`\`\`tsx
<div className="relative aspect-video w-full">
  <img 
    src={imageUrl || "/placeholder.svg"} 
    alt="Description"
    className="object-cover w-full h-full rounded-md"
  />
  <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded-md">
    <Badge>Status</Badge>
  </div>
</div>
\`\`\`

#### Image Grid for History
\`\`\`tsx
<div className="relative aspect-video w-full mb-4 bg-muted rounded-md overflow-hidden">
  <img 
    src={observation.imageUrl || "/placeholder.svg"} 
    alt={observation.comment}
    className="object-cover w-full h-full"
  />
  <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 rounded-md text-xs">
    {observation.status}
  </div>
</div>
\`\`\`

---

## Icon System

### Icon Library
**Lucide React** - Consistent, minimal line icons

### Icon Sizing Standards
\`\`\`tsx
// Standard sizes
<Icon className="h-4 w-4" />   // 16px - Small icons, buttons
<Icon className="h-5 w-5" />   // 20px - Medium icons, cards
<Icon className="h-6 w-6" />   // 24px - Large icons, navigation
<Icon className="h-8 w-8" />   // 32px - Hero icons, empty states
<Icon className="h-12 w-12" /> // 48px - Large empty states
\`\`\`

### Common Icons Used
- **Camera:** `<Camera />` - Photo capture
- **Upload:** `<Upload />` - File selection
- **Map:** `<Map />` - Location/mapping
- **History:** `<History />` - Past submissions
- **Info:** `<Info />` - Information pages
- **Check:** `<Check />` - Success states
- **X:** `<X />` - Close/cancel actions
- **MapPin:** `<MapPin />` - Location markers
- **Calendar:** `<Calendar />` - Dates
- **Clock:** `<Clock />` - Time

---

## Status Indicators & Badges

### Status Badge System
\`\`\`tsx
<Badge 
  variant={
    status === "Approved" ? "default" :
    status === "Rejected" ? "destructive" : 
    "outline"
  }
>
  {status}
</Badge>
\`\`\`

**Visual Mapping:**
- **Approved:** Green background (`default`)
- **Rejected:** Red background (`destructive`)
- **Pending:** Gray outline (`outline`)

### Loading States
\`\`\`tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    "Submit"
  )}
</Button>
\`\`\`

---

## Spacing & Layout Principles

### Spacing Scale (Tailwind)
\`\`\`css
/* Standard spacing units */
gap-1: 0.25rem;  /* 4px */
gap-2: 0.5rem;   /* 8px */
gap-4: 1rem;     /* 16px */
gap-6: 1.5rem;   /* 24px */
gap-8: 2rem;     /* 32px */
\`\`\`

### Common Spacing Patterns
\`\`\`tsx
// Vertical spacing between sections
<div className="space-y-4">

// Horizontal spacing in flex layouts
<div className="flex gap-2">

// Card content padding
<CardContent className="p-4">

// Page margins
<main className="p-4">
\`\`\`

---

## Responsive Design Patterns

### Mobile-First Approach
All components start with mobile design and scale up:

\`\`\`tsx
// Mobile: single column, Desktop: two columns
<div className="grid gap-4 md:grid-cols-2">

// Mobile: full width, Desktop: max width
<div className="w-full max-w-md">

// Mobile: stack, Desktop: side-by-side
<div className="flex flex-col md:flex-row gap-4">
\`\`\`

### Breakpoint Usage
- **Mobile (default):** Single column, full width, touch-friendly
- **Tablet (md:):** Two columns, larger touch targets
- **Desktop (lg:):** Three columns, hover states, larger content

---

## Animation & Transitions

### Subtle Animations
\`\`\`tsx
// Hover transitions
<Button className="transition-colors hover:bg-primary/90">

// Loading spinners
<Loader2 className="h-4 w-4 animate-spin" />

// Accordion animations (built into shadcn/ui)
<Accordion>
  <AccordionItem>
    <AccordionTrigger>Title</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
</Accordion>
\`\`\`

### Progress Indicators
\`\`\`tsx
<div className="w-full">
  <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div 
      className="h-full bg-primary transition-all duration-300 ease-in-out"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>
\`\`\`

---

## Error & Alert States

### Alert Component Usage
\`\`\`tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Error Title</AlertTitle>
  <AlertDescription>
    Detailed error message with helpful information.
  </AlertDescription>
</Alert>
\`\`\`

### Toast Notifications
\`\`\`tsx
toast({
  title: "Success!",
  description: "Your observation has been submitted.",
})

toast({
  title: "Error",
  description: "Something went wrong. Please try again.",
  variant: "destructive",
})
\`\`\`

---

## Map Integration Styling

### Map Container
\`\`\`tsx
<div className="h-[500px] w-full rounded-md overflow-hidden">
  <MapContainer
    center={[59.9139, 10.7522]}
    zoom={5}
    style={{ height: "100%", width: "100%" }}
  >
    {/* Map content */}
  </MapContainer>
</div>
\`\`\`

### Map Popup Styling
\`\`\`tsx
<Popup>
  <div className="max-w-xs">
    <div className="relative aspect-video w-full mb-2 bg-muted rounded-sm overflow-hidden">
      <img src={imageUrl || "/placeholder.svg"} alt={comment} className="object-cover w-full h-full" />
    </div>
    <h3 className="font-medium text-sm mb-1 line-clamp-2">{comment}</h3>
    <div className="flex items-center text-xs text-muted-foreground mb-1">
      <Calendar className="h-3 w-3 mr-1" />
      {formatDate(timestamp)}
    </div>
  </div>
</Popup>
\`\`\`

---

## Debug Components Styling

### Debug Cards
\`\`\`tsx
<Card className="mb-4">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5" />
      Debug Title
    </CardTitle>
    <Button variant="ghost" size="sm" onClick={onHide}>
      Hide
    </Button>
  </CardHeader>
  <CardContent>
    <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
      {JSON.stringify(data, null, 2)}
    </pre>
  </CardContent>
</Card>
\`\`\`

---

## Accessibility Considerations

### Color Contrast
- All text meets WCAG AA standards (4.5:1 ratio)
- Interactive elements have sufficient contrast
- Focus states are clearly visible

### Interactive Elements
\`\`\`tsx
// Proper focus management
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">

// Screen reader support
<span className="sr-only">Screen reader only text</span>

// Proper labeling
<Label htmlFor="input-id">Visible Label</Label>
<Input id="input-id" aria-describedby="help-text" />
\`\`\`

---

## Critical Design Rules

### DO NOT CHANGE:
1. **Color Palette:** The green-based primary color system
2. **Component Structure:** shadcn/ui component patterns
3. **Spacing System:** Tailwind's consistent spacing scale
4. **Mobile-First Approach:** Always design for mobile first
5. **Card-Based Layout:** Primary content containers
6. **Icon System:** Lucide React icons with consistent sizing

### MAINTAIN:
1. **Visual Hierarchy:** Clear heading structure
2. **Consistent Padding:** `p-4` for cards, `gap-4` for grids
3. **Button Patterns:** Primary/outline/icon variants
4. **Image Aspect Ratios:** `aspect-video` for observation images
5. **Status Indicators:** Consistent badge coloring
6. **Loading States:** Spinner + text patterns

### EXTEND CAREFULLY:
1. **New Components:** Follow existing shadcn/ui patterns
2. **Color Additions:** Stay within the established palette
3. **Animation:** Keep subtle and purposeful
4. **Responsive Behavior:** Maintain mobile-first approach

This design system creates a cohesive, professional appearance suitable for a scientific application while remaining approachable for citizen scientists of all technical levels.
