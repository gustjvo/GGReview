import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GamesPage from './pages/GamesPage';
import GameDetail from './pages/GameDetail';
import AddGame from './pages/AddGame';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/games"      element={<GamesPage />} />
            <Route path="/games/:id"  element={<GameDetail />} />
            <Route path="/add-game"   element={<AddGame />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/register"   element={<Register />} />
            <Route path="/profile"    element={<Profile />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
