import { useRoutes } from 'react-router';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { appRoutes } from './routes';

function App() {
  const element = useRoutes(appRoutes);
  return (
    <TooltipProvider>
      {element}
      <Toaster
        richColors
        theme="light"
        position="top-right"
        closeButton={false}
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#10120C',
            border: '1px solid #E5E7EB',
          },
        }}
      />
    </TooltipProvider>
  );
}

export default App;
