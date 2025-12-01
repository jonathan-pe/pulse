# App Navigation System

> **📝 Note**: This documentation has been moved to Notion for better collaboration and maintenance.
> 
> **View the full documentation here**: https://www.notion.so/2bcbc10acace81289b4ec75d9d9bd0dd

## Quick Reference

The Pulse web application uses a collapsible left-hand sidebar for navigation built with shadcn/ui components.

### Key Components

- **AppSidebar** (`/components/layout/AppSidebar.tsx`) - Main navigation sidebar
- **AppHeader** (`/components/layout/AppHeader.tsx`) - Minimal top header

### Keyboard Shortcut

- `Cmd+B` / `Ctrl+B` - Toggle sidebar

### Adding New Navigation Items

Edit the `navMain` or `leagues` arrays in `AppSidebar.tsx`:

```tsx
const navMain: NavItem[] = [
  {
    title: 'New Page',
    url: '/new-page',
    icon: NewIcon, // from lucide-react
  },
]
```

For full documentation including layout structure, styling, migration notes, and technical details, visit the Notion page above.

