import { BrowserRouter, Routes, Route } from "react-router"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import Destinations from "./pages/Destinations"
import Deals from "./pages/Deals"
import AccommodationTypesPage from "./pages/AccommodationTypes"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="destinations" element={<Destinations />} />
          <Route path="deals" element={<Deals />} />
          <Route path="accommodation-types" element={<AccommodationTypesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
