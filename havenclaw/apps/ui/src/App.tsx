import { Dashboard } from './pages/Dashboard'
import { Navbar } from '@/components/layout/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <Navbar />
      <Dashboard />
    </div>
  )
}

export default App
