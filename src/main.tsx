import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeSync } from '@/components/layout/ThemeSync'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeSync />
    <TooltipProvider delayDuration={200}>
      <App />
    </TooltipProvider>
    <Toaster richColors position="top-right" />
  </StrictMode>,
)
