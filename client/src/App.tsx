import { BrowserRouter, Routes, Route } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Destinations from './pages/Destinations';
import Deals from './pages/Deals';
import AccommodationTypesPage from './pages/AccommodationTypes';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyIdentity from './pages/VerifyIdentity';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="destinations" element={<Destinations />} />
          <Route path="deals" element={<Deals />} />
          <Route
            path="accommodation-types"
            element={<AccommodationTypesPage />}
          />
        </Route>
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="verify-identity" element={<VerifyIdentity />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
