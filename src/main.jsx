import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import ClientDashboardPage from './pages/ClientDashboardPage.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/model/:username" element={<App />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/explore/:location" element={<ExplorePage />} />
        <Route path="/dashboard" element={<ClientDashboardPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reviews/:username" element={<ReviewsPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
