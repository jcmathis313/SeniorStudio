import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Residents from './pages/Residents';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Residents />} />
      </Route>
    </Routes>
  );
}
