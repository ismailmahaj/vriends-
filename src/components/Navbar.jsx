import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const styles = {
    navbar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: '#E6DCCB',
      borderBottom: '1px solid rgba(58,46,37,.12)',
      padding: window.innerWidth > 768 ? '1.4rem 4rem' : '1.2rem 1.5rem'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.6rem',
      fontWeight: 600,
      color: '#3A2E25',
      textDecoration: 'none'
    },
    logoItalic: {
      fontStyle: 'italic',
      fontWeight: 300
    },
    navLinks: {
      display: window.innerWidth > 768 ? 'flex' : 'none',
      gap: '2.5rem',
      alignItems: 'center'
    },
    navLink: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.82rem',
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      color: '#3A2E25',
      textDecoration: 'none',
      opacity: 0.65,
      transition: 'opacity 0.2s'
    },
    navLinkHover: {
      opacity: 1
    },
    commandButton: {
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '.55rem 1.4rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.82rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block'
    },
    hamburger: {
      display: window.innerWidth > 768 ? 'none' : 'block',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      color: '#3A2E25',
      cursor: 'pointer'
    },
    mobileMenu: {
      display: mobileMenuOpen ? 'flex' : 'none',
      flexDirection: 'column',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: '#E6DCCB',
      borderTop: '1px solid rgba(58,46,37,.12)',
      padding: '1.5rem',
      gap: '1rem'
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          Vriends <span style={styles.logoItalic}>Poperinge</span>
        </Link>
        
        {window.innerWidth > 768 && (
          <div style={styles.navLinks}>
            <Link to="/menu" style={styles.navLink}>Menu</Link>
            <Link to="/contact" style={styles.navLink}>Contact</Link>
            {isAdmin && <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user ? (
            <>
              <Link to="/cart" style={styles.navLink}>
                Panier {itemCount > 0 && `(${itemCount})`}
              </Link>
              <span style={styles.navLink}>{user.name}</span>
              <button onClick={handleLogout} style={styles.commandButton}>
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/menu" style={styles.commandButton}>
              Commander
            </Link>
          )}
          
          <button
            style={styles.hamburger}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>
      
      {window.innerWidth <= 768 && (
        <div style={styles.mobileMenu}>
          <Link to="/menu" style={styles.navLink}>Menu</Link>
          <Link to="/contact" style={styles.navLink}>Contact</Link>
          {isAdmin && <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
