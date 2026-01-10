---
name: react-best-practices
description: Modern React patterns and anti-patterns for writing production-ready components. Use when creating or refactoring React code, hooks, or components.
---

# React Best Practices

## Core Rules

**Components must be pure**: Same inputs → same outputs. No side effects during render.

**You might not need an Effect**: Calculate during render when possible. Use Effects only for synchronizing with external systems (network, DOM, browser APIs).

**Memoize strategically**: Only memoize expensive calculations or callbacks to optimized children.

## React 19 Patterns

### `use()` Hook
```tsx
import { use } from 'react';

// ✅ Promises with Suspense
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return <CommentList comments={comments} />;
}

// ✅ Conditional Context (can't do with useContext)
function Button({ shouldUseTheme }) {
  if (shouldUseTheme) {
    const theme = use(ThemeContext);
    return <button className={theme.buttonClass}>Click</button>;
  }
  return <button>Click</button>;
}
```

## Anti-Patterns

### ❌ Derived State in useEffect
```tsx
// DON'T
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// DO
const fullName = firstName + ' ' + lastName;
```

### ❌ Missing Effect Cleanup
```tsx
// DON'T
useEffect(() => {
  fetchUser(userId).then(data => setUser(data));
}, [userId]);

// DO - prevents race conditions
useEffect(() => {
  let ignore = false;
  fetchUser(userId).then(data => {
    if (!ignore) setUser(data);
  });
  return () => { ignore = true; };
}, [userId]);
```

### ❌ Event Logic in Effects
```tsx
// DON'T
useEffect(() => {
  if (product.isInCart) {
    showNotification('Added to cart!');
  }
}, [product]);

// DO
function handleBuyClick() {
  addToCart(product);
  showNotification('Added to cart!');
}
```

### ❌ Prop Drilling > 2 Levels
```tsx
// DON'T
<Layout user={user}>
  <Header user={user}>
    <UserMenu user={user} />

// DO
<UserContext.Provider value={user}>
  <Layout />  {/* UserMenu uses use(UserContext) */}
```

## Key Patterns

### Reset State with Keys
```tsx
// When userId changes, Profile remounts with fresh state
<Profile key={userId} userId={userId} />
```

### Custom Hooks Template
```tsx
function useData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let ignore = false;
    fetch(url)
      .then(r => r.json())
      .then(json => !ignore && setData(json))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [url]);
  
  return { data, loading };
}
```

### Forms: React Hook Form + Zod
```tsx
const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

## TypeScript

### Proper Component Types
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function Button({ variant = 'primary', ...props }: ButtonProps) { }
```

### Generic Components
```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

## Decision Trees

**State Management:**
- `useState` → Local component state
- `useReducer` → Complex state with multiple sub-values
- `useContext` → Shared state for many components
- TanStack Query → Server/API data

**Performance:**
- `useMemo` → Cache expensive calculations (measure first!)
- `useCallback` → Callbacks to memoized children
- `React.memo` → Prevent expensive re-renders

**Side Effects:**
- Event handlers → User interactions
- `useEffect` → External system sync
- `useLayoutEffect` → DOM measurements (rare)

## Accessibility Checklist

- Use semantic HTML (`<button>`, not `<div onClick>`)
- Always provide `label` for inputs (via `<label>` or `aria-label`)
- Add `aria-describedby` for error messages
- Include `type="button"` on non-submit buttons
- Use `role="alert"` for dynamic error text

## Code Review Flags

🚩 Side effects during render  
🚩 Effects without cleanup  
🚩 Derived state in `useState`  
🚩 Missing dependency array items (ESLint warns)  
🚩 Mutating props/state  
🚩 `any` types  
🚩 Missing accessibility attributes  
🚩 Components > 250 lines
