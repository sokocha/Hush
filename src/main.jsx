import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import App from './App.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import ClientDashboardPage from './pages/ClientDashboardPage.jsx'
import CreatorDashboardPage from './pages/CreatorDashboardPage.jsx'
import CreatorOnboardingPage from './pages/CreatorOnboardingPage.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import './index.css'

// Skeleton Loading Component
const SkeletonLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-fuchsia-950 p-4">
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div className="skeleton-shimmer h-8 w-32 rounded-lg" />
      <div className="skeleton-shimmer h-10 w-10 rounded-full" />
    </div>

    {/* Main content skeleton */}
    <div className="space-y-4">
      {/* Card skeleton */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton-shimmer h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-4 w-3/4 rounded" />
            <div className="skeleton-shimmer h-3 w-1/2 rounded" />
          </div>
        </div>
        <div className="skeleton-shimmer h-40 w-full rounded-lg mb-3" />
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-8 flex-1 rounded-lg" />
          <div className="skeleton-shimmer h-8 flex-1 rounded-lg" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="skeleton-shimmer h-4 w-full rounded mb-2" />
            <div className="skeleton-shimmer h-3 w-2/3 rounded" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-4 w-2/3 rounded" />
              <div className="skeleton-shimmer h-3 w-1/3 rounded" />
            </div>
            <div className="skeleton-shimmer h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Page transition wrapper
const PageWrapper = ({ children }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-pageEnter">
      {children}
    </div>
  );
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <PageWrapper>{children}</PageWrapper>;
};

// Public route (redirect to explore if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/explore/all" replace />;
  }

  return <PageWrapper>{children}</PageWrapper>;
};

// Regular page wrapper for non-auth routes
const RegularRoute = ({ children }) => (
  <PageWrapper>{children}</PageWrapper>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth route - uses RegularRoute instead of PublicRoute so that
               post-registration navigates (e.g. to /creator-onboarding) aren't
               overridden. AuthPage handles its own authenticated-user redirect
               via useEffect with an isCompletingRegistration guard. */}
          <Route path="/auth" element={<RegularRoute><AuthPage /></RegularRoute>} />

          {/* Public routes (can view without auth, but some features require auth) */}
          <Route path="/" element={<Navigate to="/explore/all" replace />} />
          <Route path="/model/:username" element={<RegularRoute><App /></RegularRoute>} />
          <Route path="/explore" element={<RegularRoute><ExplorePage /></RegularRoute>} />
          <Route path="/explore/:location" element={<RegularRoute><ExplorePage /></RegularRoute>} />
          <Route path="/reviews" element={<RegularRoute><ReviewsPage /></RegularRoute>} />
          <Route path="/reviews/:username" element={<RegularRoute><ReviewsPage /></RegularRoute>} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><ClientDashboardPage /></ProtectedRoute>} />
          <Route path="/creator-onboarding" element={<ProtectedRoute><CreatorOnboardingPage /></ProtectedRoute>} />
          <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboardPage /></ProtectedRoute>} />

          {/* Catch all - redirect to explore */}
          <Route path="*" element={<Navigate to="/explore/all" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
