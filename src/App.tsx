import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TabLayout } from '@/components/layout/TabLayout'
import { Home } from '@/pages/Home'
import { History } from '@/pages/History'
import { HistoryDetail } from '@/pages/HistoryDetail'
import { Workouts } from '@/pages/Workouts'
import { WorkoutBuilder } from '@/pages/WorkoutBuilder'
import { LibraryPage } from '@/pages/Library'
import { WorkoutExecution } from '@/pages/WorkoutExecution'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<TabLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<HistoryDetail />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/workouts/new" element={<WorkoutBuilder />} />
              <Route path="/workouts/:id/edit" element={<WorkoutBuilder />} />
              <Route path="/library" element={<LibraryPage />} />
            </Route>
            <Route path="/execute/:id" element={<WorkoutExecution />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
