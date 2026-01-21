import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import App from './App.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import ClientDashboardPage from './pages/ClientDashboardPage.jsx'
import CreatorDashboardPage from './pages/CreatorDashboardPage.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import './index.css'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Public route (redirect to explore if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/explore/all" replace />;
  }

  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

          {/* Public routes (can view without auth, but some features require auth) */}
          <Route path="/" element={<App />} />
          <Route path="/model/:username" element={<App />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/:location" element={<ExplorePage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/:username" element={<ReviewsPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><ClientDashboardPage /></ProtectedRoute>} />
          <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboardPage /></ProtectedRoute>} />

          {/* Catch all - redirect to explore */}
          <Route path="*" element={<Navigate to="/explore/all" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
