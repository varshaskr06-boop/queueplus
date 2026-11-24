import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AppLayout from './layouts/AppLayout';

// 11 Core Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import LocationSearch from './pages/LocationSearch';
import LocationDetails from './pages/LocationDetails';
import AIPrediction from './pages/AIPrediction';
import CrowdMap from './pages/CrowdMap';
import CommunityReport from './pages/CommunityReport';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

// Route Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Top-Level Pages (MainLayout) */}
          <Route
            path="/"
            element={
              <MainLayout>
                <LandingPage />
              </MainLayout>
            }
          />
          <Route
            path="/login"
            element={
              <MainLayout>
                <Login />
              </MainLayout>
            }
          />
          <Route
            path="/register"
            element={
              <MainLayout>
                <Register />
              </MainLayout>
            }
          />

          {/* App & Dashboard Views (AppLayout with Sidebar) */}
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <UserDashboard />
              </AppLayout>
            }
          />
          <Route
            path="/locations"
            element={
              <AppLayout>
                <LocationSearch />
              </AppLayout>
            }
          />
          <Route
            path="/locations/:id"
            element={
              <AppLayout>
                <LocationDetails />
              </AppLayout>
            }
          />
          <Route
            path="/predictions"
            element={
              <AppLayout>
                <AIPrediction />
              </AppLayout>
            }
          />
          <Route
            path="/map"
            element={
              <AppLayout>
                <CrowdMap />
              </AppLayout>
            }
          />
          <Route
            path="/report"
            element={
              <AppLayout>
                <CommunityReport />
              </AppLayout>
            }
          />

          {/* Protected User Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin-Only Control Center */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
