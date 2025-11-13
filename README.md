# POCHOCLO - React Native Learning Project

Welcome to POCHOCLO! This is a learning-focused mobile app project designed to teach you React Native development from the ground up.

## 🎯 Project Purpose

This is an **educational project** built to help you learn:
- **React Native**: Build mobile apps using React
- **TypeScript**: Write type-safe JavaScript code
- **Expo**: Streamlined React Native development
- **Supabase**: Backend services (database, authentication, storage)

Every file in this project contains extensive comments explaining **why** and **how** things work, not just what the code does.

## 📚 What Makes This Project Special

- **Teaching-First Approach**: Code is heavily commented with educational explanations
- **Progressive Learning**: Start simple, add complexity as you learn
- **Real-World Patterns**: Learn industry best practices from the start
- **Comprehensive Comments**: Understand the "why" behind every decision

## 🛠 Tech Stack

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **React Native** | Mobile framework | Write once, run on iOS & Android |
| **TypeScript** | Language | Catch errors early with type safety |
| **Expo** | Development platform | Simplified setup, excellent tooling |
| **Supabase** | Backend service | Database, auth, storage without managing servers |

## 📁 Project Structure

```
POCHOCLO/
├── App.tsx                 # Main entry point (root component)
├── claude.md               # Guidelines for educational code
├── .env.example            # Template for environment variables
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
│
└── src/                    # Source code folder
    ├── screens/            # App screens (pages)
    │   └── HomeScreen.tsx  # Main home screen
    │
    ├── components/         # Reusable UI components
    │   └── Button.tsx      # Example reusable button component
    │
    ├── config/             # Configuration files
    │   └── supabase.ts     # Supabase client setup
    │
    ├── theme/              # Design system (NEW!)
    │   ├── colors.ts       # Color palette
    │   ├── spacing.ts      # Spacing scale (8pt grid)
    │   ├── typography.ts   # Text styles & fonts
    │   ├── radius.ts       # Border radius values
    │   ├── shadows.ts      # Shadow/elevation styles
    │   ├── animations.ts   # Animation timing
    │   ├── icons.ts        # Icon sizes
    │   ├── types.ts        # TypeScript definitions
    │   └── index.ts        # Central export
    │
    └── types/              # TypeScript type definitions
```

## 🎨 Design System

This project includes a **professional design system** - a collection of reusable design tokens that ensure consistency across your app!

### What is a Design System?

Instead of hardcoding values like `fontSize: 16` or `color: '#6200EE'` everywhere, you use semantic names like `body.regular` and `colors.primary`. This makes your code:
- **Consistent**: All screens use the same values
- **Maintainable**: Change once, updates everywhere
- **Readable**: `colors.primary` is clearer than `'#6200EE'`
- **Professional**: Industry-standard approach

### Design Tokens Included

| Category | File | What It Contains |
|----------|------|------------------|
| **Colors** | `colors.ts` | Brand colors, text colors, backgrounds, state colors (success/error/warning) |
| **Spacing** | `spacing.ts` | 8-point grid system (4, 8, 12, 16, 24, 32, 48, 64px) |
| **Typography** | `typography.ts` | Font sizes, weights, line heights, pre-styled text (headings, body, captions) |
| **Radius** | `radius.ts` | Border radius values for rounded corners (buttons, cards, etc.) |
| **Shadows** | `shadows.ts` | Elevation styles for iOS and Android (creates depth) |
| **Animations** | `animations.ts` | Duration constants and easing curves for smooth transitions |
| **Icons** | `icons.ts` | Standard icon sizes and touch target guidelines |

### Quick Example

**Before (hardcoded values):**
```typescript
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6200EE',     // ❌ What color is this?
    padding: 20,                    // ❌ Why 20? Why not 16 or 24?
    borderRadius: 12,               // ❌ Inconsistent across app
    fontSize: 16,                   // ❌ Too many magic numbers!
  }
});
```

**After (using design system):**
```typescript
import { colors, spacing, radius, body } from '../theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,  // ✅ Semantic & consistent
    padding: spacing.lg,              // ✅ Part of 8pt grid
    borderRadius: radius.md,          // ✅ Matches other components
    ...body.regular,                  // ✅ Pre-styled text
  }
});
```

### How to Use the Design System

**Import what you need:**
```typescript
import {
  colors,      // Color palette
  spacing,     // Spacing values
  headings,    // Heading text styles
  body,        // Body text styles
  radius,      // Border radius
  shadowSm,    // Small shadow
} from '../theme';
```

**Use in your components:**
```typescript
<View style={{
  backgroundColor: colors.surface,
  padding: spacing.lg,
  borderRadius: radius.md,
  ...shadowSm,
}}>
  <Text style={[headings.h1, { color: colors.primary }]}>
    Hello World!
  </Text>
</View>
```

### Learning the Design System

Each theme file is **extensively documented** with:
- What each value is for
- When to use it
- Why it exists
- Real-world examples
- Design principles explained

**Start here:**
1. Read `src/theme/colors.ts` - Learn about color systems
2. Read `src/theme/spacing.ts` - Understand the 8-point grid
3. Read `src/theme/typography.ts` - See how text hierarchy works
4. Look at `src/screens/HomeScreen.tsx` - See it in action!
5. Study `src/components/Button.tsx` - Reusable component example

### Try This!

1. Go to `src/theme/colors.ts`
2. Change `primary: '#6200EE'` to `primary: '#FF5722'` (orange)
3. Save and watch the app update instantly
4. The header, button, and counter all change color automatically!
5. **That's the power of a design system!** 🎉

### Design System Benefits

✅ **No more guessing** - Clear options for every value
✅ **Consistent look** - All screens feel cohesive
✅ **Easy to change** - Rebrand in minutes
✅ **Type-safe** - TypeScript catches typos
✅ **Self-documenting** - Code explains itself
✅ **Professional** - Industry best practices
✅ **Scalable** - Grow without chaos

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:

1. **Node.js** (v18 or newer)
   - Download: https://nodejs.org/
   - Check version: `node --version`

2. **npm** (comes with Node.js)
   - Check version: `npm --version`

3. **Git** (for version control)
   - Download: https://git-scm.com/
   - Check version: `git --version`

4. **Mobile Emulator** (choose one or both):
   - **iOS Simulator**: macOS only, requires Xcode
   - **Android Studio**: Windows, macOS, or Linux

### Installation Steps

1. **Clone or navigate to this project**
   ```bash
   cd POCHOCLO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This downloads all required packages (React Native, Expo, Supabase, etc.)

3. **Set up environment variables** (optional for now)
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Supabase credentials (see Supabase Setup below)

4. **Start the development server**
   ```bash
   npm start
   ```
   This launches Expo DevTools in your browser

## 📱 Running on Emulators

### Option 1: iOS Simulator (macOS only)

1. **Install Xcode** from the Mac App Store
2. **Open Xcode** at least once to complete setup
3. **Install Command Line Tools**:
   ```bash
   xcode-select --install
   ```
4. **Run the app**:
   - Start the dev server: `npm start`
   - Press `i` in the terminal
   - Or scan the QR code with the Camera app on your iPhone

### Option 2: Android Emulator

1. **Install Android Studio**
   - Download: https://developer.android.com/studio

2. **Set up an Android Virtual Device (AVD)**:
   - Open Android Studio
   - Go to Tools → Device Manager
   - Click "Create Device"
   - Choose a device (Pixel 5 recommended)
   - Download a system image (API 33+ recommended)
   - Finish setup

3. **Run the app**:
   - Start the dev server: `npm start`
   - Press `a` in the terminal
   - Or scan the QR code with the Expo Go app

### Option 3: Physical Device

1. **Install Expo Go app** on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Connect to same WiFi** as your computer

3. **Scan the QR code** shown in the terminal or browser

## 🗄 Supabase Setup (Optional - For Backend Features)

When you're ready to add backend functionality (database, authentication):

### 1. Create a Supabase Account

1. Go to https://supabase.com
2. Sign up (free tier available)
3. Create a new project

### 2. Get Your Credentials

1. In your Supabase project dashboard
2. Go to Settings (⚙️) → API
3. Copy these values:
   - **Project URL**: Your Supabase project URL
   - **anon/public key**: Your public API key

### 3. Configure Your App

1. Create a `.env` file (if you haven't):
   ```bash
   cp .env.example .env
   ```

2. Add your credentials to `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Restart the dev server** (Ctrl+C, then `npm start`)

### 4. Create Your First Table

1. In Supabase dashboard, go to Table Editor
2. Click "New Table"
3. Try creating a simple table (e.g., "notes" with columns: id, title, content)

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android emulator |
| `npm run ios` | Run on iOS simulator (macOS only) |
| `npm run web` | Run in web browser (experimental) |
| `npm test` | Run tests (when you add them) |

## 🎓 Learning Path

### Level 1: Getting Started (You Are Here!)
- ✅ Set up development environment
- ✅ Run app on emulator
- ✅ Understand project structure
- 🎯 Next: Explore HomeScreen.tsx and understand the code

### Level 2: React Native Basics
- Understand components and JSX
- Learn about state with useState
- Style components with StyleSheet
- Handle user input and events

### Level 3: TypeScript Integration
- Learn TypeScript basics
- Understand type annotations
- Use interfaces and types
- Catch errors at compile time

### Level 4: Navigation
- Add React Navigation
- Create multiple screens
- Navigate between screens
- Pass data between screens

### Level 5: Supabase Integration
- Connect to Supabase
- Perform CRUD operations
- Add user authentication
- Handle real-time data

### Level 6: Advanced Topics
- State management (Context API, Redux)
- Custom hooks
- Performance optimization
- Publishing to app stores

## 🔍 Code Exploration Guide

Start by reading these files in order:

1. **App.tsx**
   - Entry point of the application
   - Shows how the app initializes

2. **src/screens/HomeScreen.tsx**
   - Your first React Native component
   - Learn about JSX, state, styling
   - See interactive examples

3. **src/config/supabase.ts**
   - Backend configuration
   - Environment variables
   - Security best practices

4. **claude.md**
   - Teaching philosophy
   - Code commenting standards
   - Learning guidelines

## 💡 Key Concepts to Understand

### Components
Components are the building blocks of React Native apps. Think of them as reusable pieces of UI.

### State
State is data that can change over time. When state changes, React re-renders the component.

### Props
Props (properties) are how parent components pass data to child components.

### JSX
JSX is syntax that looks like HTML but is actually JavaScript. It describes what the UI should look like.

### TypeScript Types
Types help catch errors before you run the code. They document what kind of data is expected.

## 🐛 Troubleshooting

### "Metro bundler can't connect"
- Make sure you're on the same WiFi network
- Try restarting with: `npm start -- --reset-cache`

### "Unable to resolve module"
- Clear cache and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  npm start -- --reset-cache
  ```

### "Xcode not found"
- Install Xcode from the Mac App Store
- Run: `sudo xcode-select --switch /Applications/Xcode.app`

### Environment variables not working
- Must start with `EXPO_PUBLIC_`
- Restart dev server after changing .env
- Clear cache: `npm start -- --reset-cache`

## 📖 Learning Resources

### Official Documentation
- **React Native**: https://reactnative.dev/
- **Expo**: https://docs.expo.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Supabase**: https://supabase.com/docs

### Recommended Tutorials
- Expo Getting Started: https://docs.expo.dev/get-started/introduction/
- React Native Basics: https://reactnative.dev/docs/tutorial
- TypeScript for Beginners: https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html

### Community
- React Native Discord: https://discord.gg/react-native-community
- Expo Discord: https://discord.gg/expo
- Stack Overflow: https://stackoverflow.com/questions/tagged/react-native

## 🤝 How to Learn Effectively

1. **Read the comments**: Every file has detailed explanations
2. **Experiment**: Try changing values and see what happens
3. **Break things**: Don't be afraid to break the app - you can always undo
4. **Ask questions**: Use comments to understand, then ask if unclear
5. **Build incrementally**: Start small, add features one at a time
6. **Use Git**: Commit working code so you can always go back

## 📌 Next Steps

After getting the app running:

1. **Explore the code**: Read through HomeScreen.tsx thoroughly
2. **Make changes**: Try changing colors, text, or adding a new button
3. **Create a component**: Make your first reusable component
4. **Add navigation**: Learn to switch between multiple screens
5. **Connect Supabase**: Add a real backend to your app

## 📄 License

This is a learning project - feel free to use, modify, and learn from it!

## 🎉 You're Ready!

Run `npm start`, press `i` for iOS or `a` for Android, and start your React Native journey!

Remember: **Every expert was once a beginner.** Take your time, read the comments, experiment, and most importantly - have fun learning!

---

**Questions or stuck?** Check the code comments first - they're there to help you learn! 🚀
