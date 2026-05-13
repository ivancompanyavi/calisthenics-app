import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TabLayout } from '@/components/layout/TabLayout'
import { Toaster } from '@/components/ui/toast'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { showToast } from '@/lib/toast'
import { Home } from '@/pages/Home'
import { History } from '@/pages/History'
import { HistoryDetail } from '@/pages/HistoryDetail'
import { Workouts } from '@/pages/Workouts'
import { WorkoutBuilder } from '@/pages/WorkoutBuilder'
import { WorkoutDetail } from '@/pages/WorkoutDetail'
import { LibraryPage } from '@/pages/Library'
import { Programs } from '@/pages/Programs'
import { ProgramBuilder } from '@/pages/ProgramBuilder'
import { ProgramDetail } from '@/pages/ProgramDetail'
import { WorkoutExecution } from '@/pages/WorkoutExecution'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : 'Something went wrong',
        'error'
      )
    },
  }),
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
              <Route path="/workouts/:id" element={<WorkoutDetail />} />
              <Route path="/workouts/:id/edit" element={<WorkoutBuilder />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/new" element={<ProgramBuilder />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/programs/:id/edit" element={<ProgramBuilder />} />
              <Route path="/library" element={<LibraryPage />} />
            </Route>
            <Route path="/execute/:id" element={<WorkoutExecution />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <UpdatePrompt />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
