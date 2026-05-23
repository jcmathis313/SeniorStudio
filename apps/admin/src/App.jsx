import { Routes, Route } from 'react-router-dom';
import { UserProvider } from './lib/UserContext';
import { CommunityProvider } from './lib/CommunityContext';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Leads from './pages/Leads';
import Reports from './pages/Reports';
import Shipping from './pages/Shipping';
import Settings from './pages/Settings';
import ProfileSettings from './pages/ProfileSettings';
import OrgSettings from './pages/OrgSettings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<AuthGuard />}>
        <Route element={<UserProvider><CommunityProvider><Layout /></CommunityProvider></UserProvider>}>
          <Route index element={<Leads />} />
          <Route path="reports" element={<Reports />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="settings" element={<Settings />}>
            <Route index element={<ProfileSettings />} />
            <Route path="organization" element={<OrgSettings />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
