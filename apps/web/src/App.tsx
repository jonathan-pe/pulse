// apps/web/src/App.tsx
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Link, Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/dashboard', element: <Dashboard /> },
])

export default function App() {
  return (
    <div className="container">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="font-bold text-xl">Pulse</div>
          <nav className="text-sm opacity-80 flex gap-3">
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
        </div>
        <div>
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      <main className="card">
        <RouterProvider router={router} />
      </main>
    </div>
  )
}
