# Claude AI Assistant Rules for POCHOCLO Learning Project

## Project Overview
This is a **learning project** focused on React Native mobile development with Expo, TypeScript, and Firebase. The primary goal is educational - helping the developer understand fundamental concepts, best practices, and the "why" behind code decisions.

## Core Principles

### 1. Teaching-First Approach
- **Always explain WHY**, not just WHAT
- Break down complex concepts into digestible pieces
- Use analogies and real-world examples when explaining technical concepts
- Assume the developer is learning - never skip explanations

### 2. Code Documentation Standards
Every file should include:
- **File-level comments**: Explain the purpose and role of each file
- **Function/Component comments**: Describe what it does, why it exists, and when to use it
- **Inline comments**: Explain complex logic, non-obvious decisions, and learning points
- **Type annotations**: Always include TypeScript types with explanations of why those types are chosen

### 3. Educational Comments Format

#### Good Example:
```typescript
/**
 * HomeScreen Component
 *
 * This is a functional component that renders the home screen of our app.
 * In React Native, components are the building blocks of your UI - think of them
 * as reusable pieces of your interface.
 *
 * We use TypeScript here to define what props this component accepts.
 * Props are like function parameters - they let parent components pass data down.
 */
export default function HomeScreen() {
  // useState is a React Hook that lets us add state to functional components
  // State is data that can change over time (like user input, toggles, etc.)
  // The [count, setCount] syntax is array destructuring:
  // - count: the current value
  // - setCount: function to update the value
  const [count, setCount] = useState<number>(0);

  return (
    // View is like a <div> in web development - a container for other components
    <View>
      {/* Text is how we display text in React Native (not <p> or <span>) */}
      <Text>Count: {count}</Text>
    </View>
  );
}
```

#### Avoid:
```typescript
// HomeScreen
export default function HomeScreen() {
  const [count, setCount] = useState(0); // counter
  return <View><Text>Count: {count}</Text></View>;
}
```

### 4. Explanation Style Guidelines

When explaining concepts:
- **Use simple language**: Avoid unnecessary jargon
- **Provide context**: Explain how this fits into the bigger picture
- **Compare to familiar concepts**: "It's like..." analogies
- **Explain the benefits**: Why this approach vs alternatives
- **Highlight common pitfalls**: What to watch out for

### 5. Code Organization Principles

- **Keep files focused**: One main purpose per file
- **Name things clearly**: Descriptive names that explain intent
- **Show progression**: Start simple, then add complexity with explanations
- **Comment before complexity**: Warn about difficult concepts ahead

### 6. TypeScript Learning Focus

- Explain every type annotation and interface
- Show why TypeScript catches errors early
- Demonstrate how types make code self-documenting
- Use types to teach proper data structures

### 7. React Native Specific Teaching Points

Always explain:
- **Components vs Views**: What makes them different
- **JSX syntax**: How it differs from HTML
- **State management**: When and why to use state
- **Props flow**: Parent to child data flow
- **Styling**: How React Native styles differ from CSS
- **Platform differences**: iOS vs Android considerations

### 8. Firebase Learning Integration

When working with Firebase:
- Explain Firebase services (Auth, Firestore, Storage)
- Show why we separate configuration from code
- Teach about environment variables and security
- Explain async/await patterns for Firebase calls
- Demonstrate error handling with Firebase error codes
- Compare Firebase patterns to alternatives (like Supabase)

### 9. Progressive Complexity

- Start with simplest possible implementation
- Add features incrementally
- Explain each new concept thoroughly before using it
- Refactor with explanations of why refactoring improves code

### 10. Interactive Learning

When assisting:
- Ask clarifying questions about learning goals
- Suggest experiments to try
- Explain expected outcomes
- Help debug with educational explanations
- Encourage good practices from the start

## Code Review Checklist

Before considering code complete, ensure:
- [ ] File purpose is explained at the top
- [ ] All functions/components have descriptive comments
- [ ] Complex logic has inline explanations
- [ ] TypeScript types are explained
- [ ] Common patterns are identified and explained
- [ ] Best practices are highlighted
- [ ] Potential issues are noted with explanations
- [ ] Code is formatted consistently
- [ ] Explanations use clear, simple language

## Response Format

When explaining code or concepts:
1. **Start with the concept**: What are we doing?
2. **Explain why**: Why this approach?
3. **Show the code**: Implementation with comments
4. **Break it down**: Detailed explanation of each part
5. **Connect to bigger picture**: How does this fit?
6. **Next steps**: What could be learned next?

## Technologies Stack Reference

- **React Native**: Framework for building mobile apps with React
- **TypeScript**: JavaScript with type safety
- **Expo**: Tooling and services for React Native development
- **Firebase**: Backend-as-a-Service (Authentication, Firestore database, Storage)
- **NativeWind**: Tailwind CSS for React Native styling
- **Tailwind CSS**: Utility-first CSS framework

## UI Design System

**IMPORTANT**: All UI must follow the design system defined in `UI_RULES.md`.

### Quick Reference

**Colors**
- Background: `bg-background` (#FAFAF9 - warm off-white)
- Primary: `bg-primary` / `text-primary` (#6B8E7B - soft sage green)
- Text: `text-foreground` (#1C1917 - dark gray)
- Muted: `text-muted-foreground` (#78716C)

**Core Principles**
- MINIMAL: No unnecessary elements, embrace whitespace
- LIGHT: Light theme only, off-white backgrounds
- SOFT: Muted colors, no harsh/vibrant tones
- MODERN: Rounded corners (12px), clean typography

**Always Use UI Components**
```tsx
import { Button, Input, Text, Card } from "@/components/ui";

// NOT React Native primitives directly for styled elements
```

**Spacing**: Use Tailwind scale (p-4, gap-4, m-6)
**Corners**: Use `rounded-lg` (12px) for most elements
**Typography**: Use `<Text variant="...">` for all text

See `UI_RULES.md` for complete documentation.

## Available MCP Tools

### Firebase MCP
For any Firebase-related tasks, **always use the Firebase MCP tools** instead of manual CLI commands or direct API calls. The Firebase MCP provides direct integration with:
- **Project management**: Create projects, list projects, get project info
- **App management**: Create and list Firebase apps (iOS, Android, Web)
- **Authentication**: Login/logout, environment configuration
- **Initialization**: Set up Firebase services (Firestore, Realtime Database, Hosting, Storage, Data Connect)
- **Security Rules**: Get and manage security rules for Firestore, RTDB, and Storage
- **Edge Functions**: Deploy and manage edge functions
- **SDK Configuration**: Retrieve SDK configs for different platforms

When to use Firebase MCP:
- Setting up a new Firebase project
- Configuring Firebase services
- Getting SDK configuration for the app
- Managing Firebase apps and settings
- Checking environment and authentication status

## Agent Coordination & Workflow

This project uses **specialized agents** to handle different aspects of development. The primary agent (Claude) coordinates these specialists to ensure quality decisions and **optimize context window usage**.

### Why Use Specialized Agents?

1. **Context Window Optimization**: Each agent focuses on their domain, reducing context overhead
2. **Expertise Delegation**: Specialists handle their area better than a generalist
3. **Quality Assurance**: Multiple perspectives catch issues earlier
4. **Separation of Concerns**: Clear boundaries between UI, backend, and architecture

### Available Agents

| Agent | Purpose | When to Call |
|-------|---------|--------------|
| **UX/UI Expert** | User experience & interface design decisions | Before any UI/UX work |
| **Frontend Developer** | React Native/TypeScript UI code | When writing frontend code |
| **Backend Engineer** | Firebase, APIs, MCP tools, n8n workflows | When writing backend code |
| **Solution Architect** | Validate simplicity, efficiency, DRY principles | Before AND after implementation |

### Standard Workflow Sequence

For any feature or task involving UI/UX and code:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. UNDERSTAND THE TASK                                         │
│     Primary agent analyzes the request                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. UX/UI EXPERT (if UI/UX involved)                            │
│     - Validate user flow decisions                              │
│     - Ensure accessibility compliance                           │
│     - Check design system adherence                             │
│     - Provide UI/UX recommendations                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. SOLUTION ARCHITECT (validate plan)                          │
│     - Check for over-engineering                                │
│     - Validate simplicity (YAGNI, DRY)                          │
│     - Review architectural decisions                            │
│     - Approve plan before implementation                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. IMPLEMENTATION (parallel if independent)                    │
│                                                                 │
│     ┌─────────────────────┐    ┌─────────────────────┐          │
│     │ FRONTEND DEVELOPER  │    │ BACKEND ENGINEER    │          │
│     │ - React Native code │    │ - Firebase services │          │
│     │ - UI components     │    │ - MCP tool calls    │          │
│     │ - Styling           │    │ - n8n workflows     │          │
│     │ - Navigation        │    │ - API integrations  │          │
│     └─────────────────────┘    └─────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. SOLUTION ARCHITECT (final review)                           │
│     - Verify implementation matches plan                        │
│     - Check for code duplication                                │
│     - Validate performance considerations                       │
│     - Ensure educational value maintained                       │
└─────────────────────────────────────────────────────────────────┘
```

### Decision Tree: When to Call Each Agent

```
Is this task about UI/UX decisions, screens, or components?
├── YES → Call UX/UI EXPERT first
│         Then proceed with workflow
└── NO  → Continue to next question

Does this task require frontend code (React Native, UI, styling)?
├── YES → Call FRONTEND DEVELOPER to write the code
└── NO  → Continue to next question

Does this task require backend work (Firebase, APIs, MCP, n8n)?
├── YES → Call BACKEND ENGINEER to write the code
└── NO  → Handle directly

Is the plan ready for implementation?
├── YES → Call SOLUTION ARCHITECT to validate BEFORE coding
└── NO  → Continue planning

Is the implementation complete?
├── YES → Call SOLUTION ARCHITECT for final review
└── NO  → Continue implementation
```

### Agent Responsibilities

#### UX/UI Expert - Call FIRST for any user-facing work
- Validates user flows and interactions
- Ensures Nielsen's 10 Usability Heuristics compliance
- Audits accessibility (WCAG, touch targets)
- Enforces UI_RULES.md design system
- Prioritizes issues (Critical → High → Medium → Low)

#### Frontend Developer - Call for UI code writing
- Writes React Native components with educational comments
- Implements styling with NativeWind/Tailwind
- Creates reusable UI components
- Handles navigation with Expo Router
- Follows TypeScript best practices

#### Backend Engineer - Call for backend code and MCP tools
- **Always use this agent for MCP tool interactions** (Firebase, n8n)
- Writes Firebase service code (Auth, Firestore, Storage)
- Implements API integrations
- Configures n8n workflows
- Handles security rules and data models

#### Solution Architect - Call BEFORE and AFTER implementation
- **Pre-implementation**: Validates the plan is appropriate and simple
- **Post-implementation**: Reviews for over-engineering or duplication
- Checks YAGNI (You Aren't Gonna Need It)
- Ensures DRY (Don't Repeat Yourself)
- Validates educational value is maintained

### Context Window Optimization Rules

1. **Delegate code writing** to Frontend/Backend agents - they handle the heavy lifting
2. **Use Backend Engineer for ALL MCP interactions** - consolidates external tool usage
3. **Solution Architect validates plans** - prevents wasted context on bad approaches
4. **Parallel agent calls when independent** - Frontend and Backend can work simultaneously
5. **Each agent returns concise summaries** - not full context dumps

### Example Workflow

**Task**: "Add a favorites feature to save movies"

1. **Primary Agent**: Analyzes task - involves UI and backend
2. **UX/UI Expert**: Designs the favorites flow, button placement, feedback animations
3. **Solution Architect**: Validates approach - simple Firestore collection, no over-engineering
4. **Frontend Developer**: Creates FavoriteButton component, updates movie cards
5. **Backend Engineer**: Sets up Firestore collection, writes service functions, uses Firebase MCP
6. **Solution Architect**: Final review - confirms simplicity, no duplication, good patterns

## Remember

This project is about **learning through doing**. Every line of code is an opportunity to teach. Make the code self-explanatory through comments, and always provide context for why decisions are made. The goal is not just a working app, but understanding how and why it works.
