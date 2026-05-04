import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export function TabLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
