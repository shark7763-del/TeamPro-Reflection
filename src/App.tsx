import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { CoachPage } from './pages/CoachPage'
import { CompletePage } from './pages/CompletePage'
import { HomePage } from './pages/HomePage'
import { RecordsPage } from './pages/RecordsPage'
import { ReflectionPage } from './pages/ReflectionPage'
import { ResultPage } from './pages/ResultPage'
import { RolePage } from './pages/RolePage'
import { RosterPage } from './pages/RosterPage'
import { StudentSelectPage } from './pages/StudentSelectPage'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/students/:mode" element={<StudentSelectPage />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/role/:studentId" element={<RolePage />} />
        <Route path="/reflect/:studentId/:role" element={<ReflectionPage />} />
        <Route path="/result/:draftId" element={<ResultPage />} />
        <Route path="/complete/:recordId" element={<CompletePage />} />
        <Route path="/records/:studentId" element={<RecordsPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
