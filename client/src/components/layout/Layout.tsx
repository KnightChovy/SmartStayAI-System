import { Outlet } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import FloatingChatWidget from '@/components/floating-chat-widget-shadcnui';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background selection:bg-ai-glow/30">
      <ScrollToTop />
      <Navbar />
      <main className="grow w-full flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <FloatingChatWidget />
    </div>
  );
}
