# Claude AI Assistant Rules for POCHOCLO Learning Project

## Project Overview
This is a **learning project** focused on React Native mobile development with Expo, TypeScript, and Supabase. The primary goal is educational - helping the developer understand fundamental concepts, best practices, and the "why" behind code decisions.

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

### 8. Supabase Learning Integration

When working with Supabase:
- Explain database concepts (tables, queries, relationships)
- Show why we separate configuration from code
- Teach about environment variables and security
- Explain async/await patterns for database calls
- Demonstrate error handling best practices

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
- **Supabase**: Backend-as-a-Service (database, auth, storage)

## Remember

This project is about **learning through doing**. Every line of code is an opportunity to teach. Make the code self-explanatory through comments, and always provide context for why decisions are made. The goal is not just a working app, but understanding how and why it works.
