import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

function isDark() {
  return document.documentElement.classList.contains('dark')
}

export function ThemeToggle() {
  // The blocking script in index.html already set the class before
  // first paint, so read it back rather than recomputing the same logic.
  const [dark, setDark] = useState(isDark)

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    setDark(next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // Storage can be unavailable (blocked site data, quota). The theme still
      // applies to this page view; it just won't survive a reload — which must
      // not leave the button describing the opposite of what's on screen.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hover:text-accent-text"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
