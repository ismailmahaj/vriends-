import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import './Navbar.css';

interface NavbarProps {
  user: any;
  setUser: (user: any) => void;
}

export default function Navbar({ user, setUser }: NavbarProps) {
  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Vriends Poperinge
        </Link>
        <div className="navbar-links">
          <Link to="/">Accueil</Link>
          <Link to="/menu">Menu</Link>
          {user ? (
            <>
              <Link to="/cart">Panier</Link>
              <Link to="/profile">Profil</Link>
              {user.role === 'admin' && (
                <Link to="/dashboard">Dashboard</Link>
              )}
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
