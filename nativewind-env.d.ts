/**
 * NativeWind TypeScript Declarations
 *
 * This file tells TypeScript about NativeWind's type definitions.
 * Without this, TypeScript wouldn't know that React Native components
 * can accept className props.
 *
 * WHY WE NEED THIS:
 * - React Native's built-in types don't include className
 * - NativeWind adds className support via its Babel plugin
 * - This file imports NativeWind's type definitions so TypeScript knows about it
 *
 * HOW IT WORKS:
 * The triple-slash directive below tells TypeScript to include
 * NativeWind's type definitions, which extend React Native component props
 * to accept className as a valid prop.
 */

/// <reference types="nativewind/types" />
