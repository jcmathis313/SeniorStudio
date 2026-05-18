import { Routes, Route } from 'react-router-dom';
import { UserProvider } from './lib/UserContext';
import { CommunityProvider } from './lib/CommunityContext';
import Layout from './components/Layout';
import Leads from './pages/Leads';
import Reports from './pages/Reports';
import Shipping from './pages/Shipping';
import Settings from './pages/Settings';
import ProfileSettings from './pages/ProfileSettings';
import OrgSettings from './pages/OrgSettings';

export default function App() {
  return (
    <UserProvider>
      <CommunityProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Leads />} />
          <Route path="reports" element={<Reports />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="settings" element={<Settings />}>
            <Route index element={<ProfileSettings />} />
            <Route path="organization" element={<OrgSettings />} />
          </Route>
        </Route>
      </Routes>
      </CommunityProvider>
    </UserProvider>
  );
}
