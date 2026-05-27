import { Outlet } from "react-router"
import Navbar from "./Navbar"
import Footer from "./Footer"
import DigitalConcierge from "./DigitalConcierge"

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background selection:bg-ai-glow/30">
      <Navbar />
      <main className="flex-grow w-full flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <DigitalConcierge />
    </div>
  )
}
