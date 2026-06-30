import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SecurityPage from './pages/SecurityPage';
import { ToastProvider } from './components/ui/Toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <ToastProvider>
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} /> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/security" 
          element={
            isAuthenticated ? (
              <SecurityPage 
                username="Current_User" 
                onBack={() => window.location.href = '/dashboard'} 
                onDeleteAccountConfirm={handleDeleteAccount}
              />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;