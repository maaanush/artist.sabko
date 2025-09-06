import React from 'react'
import { createRoot } from 'react-dom/client'

const App: React.FC = () => {
  return <div>Artist of Sabko</div>
}

createRoot(document.getElementById('root')!).render(<App />)
