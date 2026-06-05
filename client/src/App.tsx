import { useRoutes } from 'react-router';
import { TooltipProvider } from './components/ui/tooltip';
import { appRoutes } from './routes';

function App() {
  const element = useRoutes(appRoutes);
  return <TooltipProvider>{element}</TooltipProvider>;
}

export default App;
