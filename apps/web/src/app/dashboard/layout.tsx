import Menubar from "@/components/dashboard/Menubar"
import Topbar from "@/components/dashboard/Topbar"

export default function DashboardLayout (
  {children}
  : {
    children: React.ReactNode
  }
) {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <section className="flex flex-1 bg-black/40">
        <Menubar />
        {children}
      </section>
    </div>
  )
}