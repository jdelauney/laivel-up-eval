---
name: user-clean-code-typescript
description: Conventions clean code complètes pour TypeScript/React/Next.js. Source unique de vérité pour les pratiques de code propre. Déclencher lors de création de code, revue de code, refactoring, ou questions sur les conventions. Couvre les standards TypeScript, règles lint, patterns frontend, sécurité, et anti-patterns à éviter.
paths: "**/*.ts, **/*.tsx"
---

# Comprehensive Clean Code Conventions

## Overview

This comprehensive clean code convention rule serves as the **single source of truth** for **ALL** clean code practices in the project. It ensures consistency throughout the codebase.

---

## Universal Clean Code Principles

### Core Quality Standards

- **Write no comments** - Code should be self-documenting through clear naming and structure
- **Use strict types only** - Leverage TypeScript's type system for compile-time safety
- **Disallow untyped values** - **EVERY VALUE** **MUST** have an explicit type
- **Use explicit constants** - **Never** use magic numbers or strings
- **Avoid double negatives** - Use positive logic for better readability
- **Use descriptive variable names** - Names **MUST** reveal intent and purpose
- **Write the simplest code possible** - **ALWAYS** Prefer clarity over cleverness
- **Eliminate duplication (DRY)** - **ALWAYS** Extract common patterns into reusable functions

### Length and Complexity Limits

- **Max 30 lines per function** - **ALWAYS** **Keep** functions focused and testable
- **Max 5 parameters per function** - Use objects for complex parameter sets
- **Max 300 lines per file** - **ALWAYS** **Split** large files into focused modules
- **Max 10 sub-files per folder** - **ALWAYS** **Organize** related files into logic subfolders
- **Max 3 levels of nesting** - **ALWAYS** **Reduce** cognitive complexity

### Performance Guidelines

- **Avoid premature optimization** - **ALWAYS** Focus on clarity first
- **Minimize dependencies** - **ALWAYS** **Keep** imports focused and necessary
- **Cache expensive operations** - **Only** when proven necessary

### Responsibility Boundaries

- **One responsibility per file** - **EACH FILE** **SHOULD** have a single, clear purpose
- **One responsibility per function** - Functions **ALWAYS** **MUST** do one thing well
- **No flag parameters** - **ALWAYS** Use separate functions instead of boolean flags
- **Separate concerns** :
  - **Frontend** : **ALWAYS** Keep business logic separate from presentation logic ("LRS Smart / Dumb pattern )
  - **Backend** : **ALWAYS** Keep **EXISTING** project "Clean Architure" patterns

---

## TypeScript Standards

- **ALWAYS** use Consistent naming
- **ALWAYS AVOID** Default exports (avoid unless required by framework or the user)
- **ALWAYS** Use camelCase and descriptive name for functions and variables
- **ALWAYS** Use PascalCase for enums, types, interfaces, classes
- **ALWAYS** Use SCREAMING_SNAKE_CASE for constants
- **ALWAYS** Group constants with "const" object
- **ALWAYS** Use plural nouns for Arrays and collections
- **ALWAYS** Use "is / has/ should" prefix for Boolean variables
- **ALWAYS** Use Types over Interfaces for Objects without callback functions
- **ALWAYS** Use concise character class syntax "\d" instead "[0-9]" in RegEx expressions
- **ALWAYS** Extract nested ternary operation into an independant statement as soon as possible
- **ALWAYS** Extract nested template literals
- Prefer using an optional chain expression in logical expression that checks for null/undefined before accessing the property

---

## Lint Best Practices (HTML, CSS, TS)

Those rules guide implementation best practices over the application on what can be done and what cannot be done.

### Do's

- Always sort imports by name
- Always sort css class by name
- Only use the `scope` prop on `<th>` elements.
- Make sure label elements have text content and are associated with an input.
- Make static elements with click handlers use a valid role attribute.
- Always include a `title` element for SVG elements.
- Give all elements requiring alt text meaningful information for screen readers.
- Make sure anchors have content that's accessible to screen readers.
- Assign `tabIndex` to non-interactive HTML elements with `aria-activedescendant`.
- Include all required ARIA attributes for elements with ARIA roles.
- Make sure ARIA properties are valid for the element's supported roles.
- Always include a `type` attribute for button elements.
- Make elements with interactive roles and handlers focusable.
- Give heading elements content that's accessible to screen readers (not hidden with `aria-hidden`).
- Always include a `lang` attribute on the html element.
- Always include a `title` attribute for iframe elements.
- Accompany `onClick` with at least one of: `onKeyUp`, `onKeyDown`, or `onKeyPress`.
- Accompany `onMouseOver`/`onMouseOut` with `onFocus`/`onBlur`.
- Include caption tracks for audio and video elements.
- Use semantic elements instead of role attributes in JSX.
- Make sure all anchors are valid and navigable.
- Ensure all ARIA properties (`aria-*`) are valid.
- Use valid, non-abstract ARIA roles for elements with ARIA roles.
- Use valid ARIA state and property values.
- Use valid values for the `autocomplete` attribute on input elements.
- Use correct ISO language/country codes for the `lang` attribute.
- Use for...of statements instead of Array.forEach.
- Use Date.now() to get milliseconds since the Unix Epoch.
- Use .flatMap() instead of map().flat() when possible.
- Use literal property access instead of computed property access.
- Use concise optional chaining instead of chained logical expressions.
- Use regular expression literals instead of the RegExp constructor when possible.
- Remove redundant terms from logical expressions.
- Use while loops instead of for loops when you don't need initializer and update expressions.
- Make sure builtins are correctly instantiated.
- Make sure super() is called exactly once on every code path in a class constructor before this is accessed if the class has a superclass.
- Make sure void (self-closing) elements don't have children.
- Make sure all dependencies are correctly specified in React hooks.
- Make sure all React hooks are called from the top level of component functions.
- Use isNaN() when checking for NaN.
- Make sure "for" loop update clauses move the counter in the right direction.
- Make sure typeof expressions are compared to valid values.
- Make sure generator functions contain yield.
- Make sure Promise-like statements are handled appropriately.
- Prevent import cycles.
- Make sure getters and setters for the same property are next to each other in class and object definitions.
- Make sure object literals are declared consistently (defaults to explicit definitions).
- Use static Response methods instead of new Response() constructor when possible.
- Make sure switch-case statements are exhaustive.
- Make sure the `preconnect` attribute is used when using Google Fonts.
- Use `Array#{indexOf,lastIndexOf}()` instead of `Array#{findIndex,findLastIndex}()` when looking for the index of an item.
- Make sure iterable callbacks return consistent values.
- Use `with { type: "json" }` for JSON module imports.
- Use numeric separators in numeric literals.
- Use object spread instead of `Object.assign()` when constructing new objects.
- Always use the radix argument when using `parseInt()`.
- Make sure JSDoc comment lines start with a single asterisk, except for the first one.
- Include a description parameter for `Symbol()`.
- Declare regex literals at the top level.
- Use `String.slice()` instead of `String.substr()` and `String.substring()`.
- Use `as const` instead of literal types and type annotations.
- Use `at()` instead of integer index access.
- Follow curly brace conventions.
- Use `else if` instead of nested `if` statements in `else` clauses.
- Use single `if` statements instead of nested `if` clauses.
- Use either `T[]` or `Array<T>` consistently.
- Use `new` for all builtins except `String`, `Number`, and `Boolean`.
- Use consistent accessibility modifiers on class properties and methods.
- Use `const` declarations for variables that are only assigned once.
- Put default function parameters and optional function parameters last.
- Include a `default` clause in switch statements.
- Initialize each enum member value explicitly.
- Use the `**` operator instead of `Math.pow`.
- Use `export type` for types.
- Use `for-of` loops when you need the index to extract an item from the iterated array.
- Use `<>...</>` instead of `<Fragment>...</Fragment>`.
- Use `import type` for types.
- Make sure all enum members are literal values.
- Use `node:assert/strict` over `node:assert`.
- Use the `node:` protocol for Node.js builtin modules.
- Use Number properties instead of global ones.
- Use assignment operator shorthand where possible.
- Use function types instead of object types with call signatures.
- Use template literals over string concatenation.
- Use `new` when throwing an error.
- Use `String.trimStart()` and `String.trimEnd()` over `String.trimLeft()` and `String.trimRight()`.
- Use standard constants instead of approximated literals.
- Use `===` and `!==`.
- Use Number.isFinite instead of global isFinite.
- Use Number.isNaN instead of global isNaN.
- Make sure to use new and constructor properly.
- Make sure the assertion function, like expect, is placed inside an it() function call.
- Watch out for possible "wrong" semicolons inside JSX elements.
- Make sure async functions actually use await.
- Make sure default clauses in switch statements come last.
- Make sure to pass a message value when creating a built-in error.
- Make sure get methods always return a value.
- Use a recommended display strategy with Google Fonts.
- Make sure for-in loops include an if statement.
- Use Array.isArray() instead of instanceof Array.
- Use the namespace keyword instead of the module keyword to declare TypeScript namespaces.
- Make sure to use the digits argument with Number#toFixed().
- Make sure to use the "use strict" directive in script files.

### Required Practices

Every rule below states the **required behavior**. When a construct is banned, the rule names the **approved replacement** to use instead.

- Import each module from its own file; keep folders free of `index.ts` barrel re-exports.
- Give every element produced by an iterator or collection literal a stable `key` prop.
- Collect promises inside the loop and resolve them together with `Promise.all()` after it.
- Express conditions and arithmetic with logical and arithmetic operators; keep bitwise operators for documented low-level code only.
- Keep every expression meaningful: an operation must change its operand's value.
- In Solid projects, read props through the `props` object to preserve reactivity.
- Resolve module paths from `import.meta.url` instead of `__dirname` / `__filename`.
- Define every React component at module top level.
- Attach event handlers to interactive elements (`button`, `a`, `input`) or to elements given an explicit interactive role.
- Treat props as read-only; derive local state when a value must change.
- Use the HTML elements allowed by the project's restricted-elements configuration.
- Load API keys, tokens, and secrets from environment variables.
- Give each declaration a name that is unique across its enclosing scopes.
- Fix the type error, or document a narrow exception with `@ts-expect-error` plus a reason.
- Write regex backreferences that point to a group already matched.
- Escape only the characters that require it in string literals.
- Omit `undefined` wherever it is already the implicit value.
- Accumulate with `push()` or direct assignment inside `reduce` to keep the reduction linear.
- Return nothing from functions typed `void`.
- Remove a property by rebuilding the object without it (rest destructuring or a new literal).
- Access namespace-import members with static, literal property names.
- Use `next/image` for images in Next.js projects.
- Import the named bindings you need explicitly.
- Pair every `target="_blank"` with `rel="noopener"`.
- Render content as JSX children; keep `dangerouslySetInnerHTML` and other dangerous props out of components.
- Give each element a single content source: `children` **or** `dangerouslySetInnerHTML`.
- Parse data with `JSON.parse()` and dispatch behavior through functions or lookup maps instead of `eval()`.
- Return a promise, or use `async` / `await`, in asynchronous tests and hooks.
- Model enumerations with an `as const` object plus its derived union type.
- Re-export explicitly with `export { name } from './module'`.
- Set document head tags through the Next.js Metadata API.
- Let TypeScript infer the type of declarations initialized with a literal expression.
- Organize code with ES modules.
- Write the positive condition first and put the negative case in the `else` branch.
- Extract nested conditionals into named variables, early returns, or a `switch`.
- Narrow nullable values with a type guard or an explicit fallback.
- Assign a local variable when a parameter's value needs to change.
- Declare class fields explicitly and assign them in the constructor body.
- Import only the modules allowed by the project's restricted-imports configuration.
- Use the types allowed by the project's restricted-types configuration.
- Give a constant a value that carries information beyond its own name.
- Use quoted strings when there is no interpolation or special-character handling.
- Return or break early, then continue at the outer level without an `else` block.
- Put the variable on the left of a comparison and the literal on the right.
- Create arrays with literals (`[]`) or `Array.from()`.
- Self-close components that have no children (`<Component />`).
- Throw `Error` instances (or subclasses of `Error`).
- Key list items by a stable identifier taken from the data.
- Assign in a dedicated statement, then use the variable in the expression.
- Pass a synchronous executor to `new Promise()` and do the async work around it.
- Keep the caught exception binding intact; introduce a new variable for derived values.
- Treat a class binding as constant once declared.
- Write JSX comments inside braces (`{/* ... */}`).
- Compare with `0`, and use `Object.is(value, -0)` when the sign matters.
- Reserve labeled statements for loops.
- Use `void` as a return type or generic argument only; use `undefined` elsewhere.
- Log through the project's logger.
- Use `as const` objects for compile-time constant sets.
- Keep regular expression literals to printable characters.
- Debug with IDE breakpoints and ship code free of `debugger` statements.
- Set cookies through the project's cookie helper or server API.
- Import `next/document` only inside `pages/_document.jsx`.
- Give each `case` label a distinct value.
- Declare each class member once.
- Give each branch of an `if` / `else if` chain a distinct condition.
- Set each JSX prop once per element.
- Give each key in an object literal a unique name.
- Give each function parameter a unique name.
- Declare each test hook (`beforeEach`, `afterEach`, ...) once per `describe` block.
- Fill every block statement and static block with code, or remove it.
- Give every declared type at least one member, or alias the underlying type directly.
- Declare a variable's type up front so it stays stable across reassignments.
- Type every value precisely; use `unknown` plus narrowing when the shape is unknown at compile time.
- Keep test files self-contained and move shared helpers into a dedicated module.
- Prove non-nullability with a runtime check before access rather than asserting it with `!`.
- End each `switch` clause with `break`, `return`, or `throw`.
- Commit tests that all run: keep `.only` out of the suite.
- Treat a declared function name as constant.
- Add behavior in your own modules and leave native objects and read-only globals untouched.
- Use `next/document`'s `<Head>` inside `pages/_document.js`.
- Annotate or initialize every declaration so its type is explicit.
- Treat imported bindings as read-only; export a mutator from the source module when a change is needed.
- Use regular spaces, tabs, and line breaks.
- Give labels names distinct from the variables in scope.
- Put multi-code-point characters in a regex alternation group rather than a character class.
- Write the full expression whenever a shorthand assignment would repeat the variable on both sides.
- Escape characters with `\xNN` or `\uNNNN` sequences.
- Call `Object.prototype` methods through `Object.hasOwn()` or `Object.prototype.method.call(target)`.
- Declare each name once per scope.
- Declare `"use strict"` once per script file; ES modules are already strict.
- Compare two distinct operands, and use `Number.isNaN()` for NaN checks.
- Choose identifiers that differ from restricted names (`undefined`, `NaN`, `Infinity`, ...).
- Keep every committed test enabled: repair or delete the ones you would skip.
- Give every array slot an explicit value.
- Use a template literal (backticks) as soon as a string contains `${...}`.
- Name object properties something other than `then` so they stay distinguishable from promises.
- Declare a class's full shape inside the class itself rather than merging an interface into it.
- Parenthesize the negated expression (`!(key in object)`).
- Declare variables with `const`, or `let` when reassignment is required.
- Access object members through an explicit reference.
- Group all overload signatures of a function together.
- Provide keyboard shortcuts through the application's own handler layer instead of the `accessKey` attribute.
- Keep focusable elements exposed to assistive technology; remove them from the tab order when they must be hidden.
- Apply ARIA roles, states, and properties only to elements that support them.
- Convey emphasis with CSS transitions that honour `prefers-reduced-motion`.
- Give interactive elements interactive ARIA roles, or keep their implicit ones.
- Reserve `tabIndex` for interactive elements.
- Set `tabIndex` to `0` or `-1` and let DOM order drive the focus sequence.
- Describe the content itself in an img `alt` prop; the element already announces that it is an image.
- Rely on an element's implicit role and set `role` only to override it.
- Express repeated spaces as ` {2}` in regular expression literals.
- Collect extra arguments with rest parameters (`...args`).
- Alias a type only when the alias adds meaning; use the primitive directly otherwise.
- Write each operation as its own statement.
- Declare type parameters only when the type actually uses them.
- Keep each function under the configured Cognitive Complexity score by extracting helpers.
- Keep `describe()` nesting shallow in test files.
- Pass the expression directly wherever a boolean is already expected.
- Use `flat()` when the `flatMap` callback would just return its argument.
- Export standalone functions and constants from a module instead of a static-only class.
- Reference the class by its name in static contexts.
- Catch an error only to handle, enrich, or log it; otherwise let it propagate.
- Declare a constructor only when it does work beyond the default one.
- Let the loop body end naturally when `continue` would be its last statement.
- Export bindings that consumers actually use.
- Escape only the characters that need it in regular expression literals.
- Return the single child directly when a fragment would wrap only one node.
- Use labels only to break or continue an outer loop.
- Introduce a block statement only when it scopes declarations.
- Use shorthand syntax when an import, export, or destructured alias matches the original name.
- Merge adjacent string and template literals into a single literal.
- Use `String.raw` only when the template contains escape sequences.
- Keep each `case` that changes behavior and fold the rest into `default`.
- Return the boolean expression directly when a ternary would only yield `true` / `false`.
- Use arrow functions so `this` stays bound without an alias.
- Constrain generics with the narrowest type that fits, or omit the constraint.
- Declare the variable without an initializer when its value starts out undefined.
- Use `undefined` directly, and plain statements for their side effects, instead of the `void` operator.
- Write binary, octal, and hexadecimal values as literals (`0b`, `0o`, `0x`).
- Name numeric object members with plain base-10 literals.
- Pass children between the component's opening and closing tags.
- Declare with `let` any binding that must be reassigned.
- Make every condition depend on a runtime value.
- Order clamp bounds so `Math.min` / `Math.max` can actually vary the result.
- Let a constructor initialize the instance, and use a factory function when another value must be returned.
- Give every regex character class at least one member.
- Bind at least one name in a destructuring pattern, or drop the pattern.
- Use `Math`, `JSON`, and `Reflect` as namespaces and call their methods.
- Scope declarations to their block with `const`, `let`, and function expressions.
- Call `super()` exactly once in every derived-class constructor, before any access to `this`.
- Declare a binding before its first use.
- Write `8` and `9` as plain characters in string literals.
- Keep numeric literals within `Number.MAX_SAFE_INTEGER`, and use `BigInt` beyond it.
- Access the mounted tree through refs rather than the return value of `React.render`.
- Assign a value that differs from the assignment target.
- Let a setter perform its assignment and return nothing.
- Compare a `toLowerCase()` result against a lowercase literal, and a `toUpperCase()` result against an uppercase one.
- Wrap a `case` body in braces as soon as it declares `const`, `let`, or a class.
- Declare or import every identifier you reference.
- Keep every statement reachable: place `return` and `throw` last in their block.
- Restrict `finally` to cleanup, and return or throw from `try` / `catch`.
- Use plain property access wherever the value is guaranteed non-nullish.
- Use every declared parameter, or prefix it with `_` when the signature requires its presence.
- Import only what the module uses.
- Reference every label you declare.
- Keep only the private class members that are used.
- Declare a variable only where it is used.

---

## Path Aliases for Imports

- **ALWAYS** **use import aliases** for cross-directory imports to maintain clean, maintainable, and scalable code. Only use relative imports for files within the same folder.
- **ALWAYS** Use type-only imports for better tree shaking
- **NEVER** Use relative path for Imports

Based on [tsconfig.json](mdc:tsconfig.json), the following aliases are available:

- `@/*` - Project root

---

## Backend Clean Architecture Code Standards

[NEED TO BE DEFINED]

---

## Frontend Clean Code Standards

### LRS (Layered React Structure) "Smart / Dumb pattern"

- **Smart Components** - Handle business logic, state management, and data fetching
- **Dumb Components** - Pure presentation components with no business logic
- **Feature Organization** - Group related components, hooks, and stores by feature
- **Separation of Concerns** - Clear boundaries between presentation and business logic

### Component Design Principles

- **ALWAYS** ONE Single responsibility per component
- Props **MUST** **ALWAYS** be explicit and typed
- Handle loading and error states properly
- Implement proper accessibility (ARIA attributes)
- **ALWAYS** Use semantic HTML elements and `TailwindCSS version 4` for styling
- **SHOULD** Reuse existing components

### State Management Standards

- **Server State** - Use React Query for data fetching (+ caching) and for mutations
- **Client State** - Use Zustand for component-specific UI state
- **Form State** - Use controlled components with proper validation
- **Global State** - Minimize global state, prefer local state when possible

### Form Management Principles

- Smart form components handle business logic
- Dumb form components handle presentation
- Implement proper validation with user-friendly messages
- Handle submission states (loading, success, error)
- **Form State** - Use `React Hook Form` controlled components with proper **real time validation**
- **ALWAYS** Use `React Query` for optimistics data mutations when needed
- Use `Zod` for Implement proper validation with user-friendly messages
- Handle submission states (loading, success, error)

### Frontend Clean Code Principles

#### Common Rules

- **ALWAYS** **USE Types instead of Interface for React Components Props**
- **ALWAYS** mark the props of components as **read-only** (e.g. `type ComponentProps = Readonly<{ [...properties] }>;`)
- **NEVER** export components props Types
- **ALWAYS** **Use PropsWithChildren** for components accepting children :
  **examples** :

  ```ts
  // Example 1 : in props
  type ComponentProps = Readonly<
    {
      [...properties];
    } & PropsWithChildren
  >;

  // Example 2 : in function signature
  export function myComponent({ children }: Readonly<PropsWithChildren>) {
    return <div>{children}</div>;
  }
  ```

- **Implement proper error boundaries** and loading states
- **Clean up side effects** in useEffect cleanup functions
- **ALWAYS** Treat state as immutable
- **Use Server Components** for data fetching as soon as possible
- **ALWAYS** **Use Suspense** for async server components
- **ALWAYS** Import React explicitly : `import React from 'react';`
- **ALWAYS** Prefix client handling event in Props function with "on" (e.g. 'onClick')
- **ALWAYS** Suffix handling event function in Props with "Action" to indicatate it is a server action (e.g : onSearchAction)

---

## Next.js and React Specific Performance Patterns

### 1. Memoization Patterns

- **React.memo**: Prevent unnecessary re-renders of components
- **useMemo**: Cache expensive calculations and derived data
- **useCallback**: Stabilize function references for child components
- **Custom comparison**: Advanced memo with custom equality functions

### 2. React 19 Specific Optimization Features

- **Concurrent rendering**: Automatic optimization for user interactions
- **Suspense boundaries**: Progressive loading of page sections
- **Transition APIs**: Smooth state transitions without blocking UI
- **useOptimistic**: Optimistic updates with automatic rollback

### 3. Next.js 15 and up Specific Optimization Features

- **ALWAYS** Use "server actions" for initial data fetching and SEO-critical content.
- **Implement proper caching** with React `cache()` and `unstable_cache()`
- **unstable_cache()**: Persistent cache across requests
- **Use tagged cache invalidation** for granular cache control with revalidateTag
- **Path invalidation**: Page-specific cache control with revalidatePath
- **React.lazy**: Component-level lazy loading with Suspense
- **Use Next.js Image** for optimized image loading
- **Implement code splitting** at route and component levels
- **Debounce expensive operations** (search, API calls...)
- **Next.js dynamic**: Advanced dynamic imports with custom loading states
- **Route-based splitting**: Split bundles at page/route boundaries
- **Conditional loading**: Load features only when needed

### 4. Advanced Routing Patterns

- **Parallel data fetching**: `Promise.all()` for simultaneous API calls
- **Streaming with Suspense**: Progressive loading of page sections
- **Error boundaries**: Granular error handling at component level
- **Loading states**: Custom loading UI for different sections
- **Metadata generation**: Dynamic SEO optimization

### Specific Required Practices

- **Initial data fetching**: fetch it in Server Components or server actions, and keep React Query for client-side refetching, caching, and mutations
- **State updates**: **ALWAYS** produce a new object or array (immutable updates)
- **useEffect**: **ALWAYS** give every effect an explicit dependency array
- **Deep state sharing**: pass it through context or a store instead of drilling props across many levels
- **Expensive operations**: keep the main thread free by memoizing, deferring with `startTransition`, or moving work to a worker
- **Browser APIs**: access them from Client Components (`"use client"`) or inside effects
- **Children typing**: **ALWAYS** Use `PropsWithChildren` instead of `ReactNode`

### Right-sized Optimization

- **Premature optimization**: Profile first, optimize based on real performance issues
- **Targeted memoization**: memoize the components where profiling shows a measurable gain
- **Simple solutions**: prefer them, they often perform better than complex optimizations

---

## Security Guidelines

- **Validate all user inputs** with Zod schemas
- **Sanitize data** before rendering
- **Implement proper authentication** checks in Server Components
- **Never expose sensitive data** in client components
- **Use environment variables** for configuration
- **Implement proper error handling** without leaking information
- **Implement proper CSRF protection**
- **Use environment variables for sensitive data**

---

## Anti-Patterns to Avoid

### Universal Code Smells

- **God objects** - Classes that do too much
- **Long parameter lists** - Use objects or builder patterns
- **Deep nesting** - Extract functions to reduce complexity
- **Magic numbers** - Use named constants
- **Commented code** - Remove dead code instead of commenting

### Frontend-Specific Anti-Patterns

- **Mixed concerns** - Keep business logic in smart containers and presentation in dumb components
- **Global state overuse** - Keep component-specific UI state local
- **Ignored states** - Render an explicit loading and error state in every user interface
- **Accessibility neglect** - Build accessibility into every component from the start
- **Overly complex components** - Break down complex components into smaller ones

### Architecture Violations

- **Circular dependencies** - Maintain clear layer boundaries
- **Tight coupling** - Use dependency injection and interfaces
- **Leaky abstractions** - Keep implementation details hidden
- **Mixed concerns** - Separate business logic from presentation logic

---

## Implementation Guidelines

### CONSTRAINTS - REQUIRED

- **ALWAYS READ FULLY AND CAREFULLY THIS GUIDELINE BEFORE PLAN OR IMPLEMENT CODE**
- **NEVER SUMMARIZE THIS GUIDELINE**
- **ALWAYS KEEP ALL INFORMATIONS IN THIS GUIDELINE IN THE CONTEXT**

### Key Documentation References

#### CRITICAL DOCUMENTATION PATTERN

This prevents context loss! Update this file part IMMEDIATELY when creating important docs.

**ALWAYS ADD IMPORTANT DOCS HERE!** When you create or discover:
**Root path for docs** : `devbook/docs/llm/`

- Architecture diagrams → Add reference path here
- Database schemas → Add reference path here
- Problem solutions → Add reference path here
- Setup guides → Add reference path here
- ...

### Universal Checklist

- [ ] Function has single responsibility
- [ ] Function is under 30 lines
- [ ] No magic numbers or strings
- [ ] All variables have descriptive names
- [ ] No commented code
- [ ] Tests are written and passing
- [ ] No circular dependencies
- [ ] Error handling is implemented
- [ ] Types are explicit and strict

---
