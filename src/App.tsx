import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TabLayout } from '@/components/layout/TabLayout'
import { Toaster } from '@/components/ui/toast'
import { ConfirmProvider } from '@/components/ui/confirm'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { showToast } from '@/lib/toast'

// Lazy-load route components so the initial bundle only ships Home + shell.
// Named exports are unwrapped via the `then(m => ({ default: m.X }))` form.
const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const History = lazy(() => import('@/pages/History').then((m) => ({ default: m.History })))
const HistoryDetail = lazy(() => import('@/pages/HistoryDetail').then((m) => ({ default: m.HistoryDetail })))
const Workouts = lazy(() => import('@/pages/Workouts').then((m) => ({ default: m.Workouts })))
const WorkoutBuilder = lazy(() => import('@/pages/WorkoutBuilder').then((m) => ({ default: m.WorkoutBuilder })))
const WorkoutDetail = lazy(() => import('@/pages/WorkoutDetail').then((m) => ({ default: m.WorkoutDetail })))
const LibraryPage = lazy(() => import('@/pages/Library').then((m) => ({ default: m.LibraryPage })))
const Programs = lazy(() => import('@/pages/Programs').then((m) => ({ default: m.Programs })))
const ProgramBuilder = lazy(() => import('@/pages/ProgramBuilder').then((m) => ({ default: m.ProgramBuilder })))
const ProgramDetail = lazy(() => import('@/pages/ProgramDetail').then((m) => ({ default: m.ProgramDetail })))
const WorkoutExecution = lazy(() =>
  import('@/pages/WorkoutExecution').then((m) => ({ default: m.WorkoutExecution })),
)
const SettingsPage = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

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

function RouteFallback() {
  return <div className="min-h-dvh" />
}

// Per-route boundary: a crash in one page should not nuke navigation. The
// outer ErrorBoundary in App stays as the last-resort catch-all.
function RouteBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<TabLayout />}>
              <Route path="/" element={<RouteBoundary><Home /></RouteBoundary>} />
              <Route path="/history" element={<RouteBoundary><History /></RouteBoundary>} />
              <Route path="/history/:id" element={<RouteBoundary><HistoryDetail /></RouteBoundary>} />
              <Route path="/workouts" element={<RouteBoundary><Workouts /></RouteBoundary>} />
              <Route path="/workouts/new" element={<RouteBoundary><WorkoutBuilder /></RouteBoundary>} />
              <Route path="/workouts/:id" element={<RouteBoundary><WorkoutDetail /></RouteBoundary>} />
              <Route path="/workouts/:id/edit" element={<RouteBoundary><WorkoutBuilder /></RouteBoundary>} />
              <Route path="/programs" element={<RouteBoundary><Programs /></RouteBoundary>} />
              <Route path="/programs/new" element={<RouteBoundary><ProgramBuilder /></RouteBoundary>} />
              <Route path="/programs/:id" element={<RouteBoundary><ProgramDetail /></RouteBoundary>} />
              <Route path="/programs/:id/edit" element={<RouteBoundary><ProgramBuilder /></RouteBoundary>} />
              <Route path="/library" element={<RouteBoundary><LibraryPage /></RouteBoundary>} />
              <Route path="/settings" element={<RouteBoundary><SettingsPage /></RouteBoundary>} />
            </Route>
            <Route path="/execute/:id" element={<RouteBoundary><WorkoutExecution /></RouteBoundary>} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <UpdatePrompt />
        </ConfirmProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
