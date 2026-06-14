import { BottomNav } from '@/components/ui/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}
