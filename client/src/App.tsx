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
        duration={500}
      />
    </TooltipProvider>
  );
}

export default App;
