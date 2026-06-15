import { BottomNav } from '@/components/ui/BottomNav'
import { PageTransition } from '@/components/ui/PageTransition'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}
