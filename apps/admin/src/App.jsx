import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Residents from './pages/Residents';
import Shipping from './pages/Shipping';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Residents />} />
        <Route path="shipping" element={<Shipping />} />
      </Route>
    </Routes>
  );
}
