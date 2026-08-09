import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { user, logout, isAdmin, isStaff } = useAuth();
  const { itemCount } = useCart();
  const { t, language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      padding: isMobile ? '1.2rem 1.5rem' : '1.4rem 4rem',
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '0.75rem',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
    },
    logo: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: isMobile ? '1.35rem' : '1.6rem',
      fontWeight: 600,
      color: '#3A2E25',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    },
    logoItalic: {
      fontStyle: 'italic',
      fontWeight: 300,
    },
    navLinks: {
      display: 'flex',
      gap: '2.5rem',
      alignItems: 'center',
    },
    navLink: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.82rem',
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      color: '#3A2E25',
      textDecoration: 'none',
      opacity: 0.65,
      transition: 'opacity 0.2s',
      whiteSpace: 'nowrap',
    },
    commandButton: {
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: isMobile ? '.45rem 1rem' : '.55rem 1.4rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.82rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
      whiteSpace: 'nowrap',
    },
    hamburger: {
      display: 'block',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      color: '#3A2E25',
      cursor: 'pointer',
      padding: '0.2rem 0.35rem',
      lineHeight: 1,
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
      gap: '1rem',
    },
    langBtn: (active) => ({
      background: active ? '#3A2E25' : 'transparent',
      color: active ? '#F7F5F2' : '#3A2E25',
      border: '1px solid #3A2E25',
      padding: '0.3rem 0.55rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.75rem',
      cursor: 'pointer',
      textTransform: 'uppercase',
    }),
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          Vriends <span style={styles.logoItalic}>Poperinge</span>
        </Link>

        {!isMobile && (
          <div style={styles.navLinks}>
            <Link to="/menu" style={styles.navLink}>
              {t('menu')}
            </Link>
            <Link to="/contact" style={styles.navLink}>
              {t('contact')}
            </Link>
            {isStaff && (
              <Link to="/pos" style={styles.navLink}>
                {t('posCashRegister')}
              </Link>
            )}
            {isAdmin && (
              <Link to="/dashboard" style={styles.navLink}>
                {t('dashboard')}
              </Link>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.65rem' : '1.5rem',
            marginLeft: 'auto',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button type="button" onClick={() => changeLanguage('fr')} style={styles.langBtn(language === 'fr')}>
              FR
            </button>
            <button type="button" onClick={() => changeLanguage('nl')} style={styles.langBtn(language === 'nl')}>
              NL
            </button>
            <button type="button" onClick={() => changeLanguage('en')} style={styles.langBtn(language === 'en')}>
              EN
            </button>
          </div>

          {user ? (
            <>
              <Link to="/cart" style={styles.navLink}>
                {t('cart')} {itemCount > 0 && `(${itemCount})`}
              </Link>
              {!isMobile && <span style={styles.navLink}>{user.name}</span>}
              <button type="button" onClick={handleLogout} style={styles.commandButton}>
                {t('logout')}
              </button>
            </>
          ) : (
            <Link to="/menu" style={styles.commandButton}>
              {t('order')}
            </Link>
          )}

          {isMobile && (
            <button type="button" style={styles.hamburger} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              ☰
            </button>
          )}
        </div>
      </div>

      {isMobile && (
        <div style={styles.mobileMenu}>
          <Link to="/menu" style={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            {t('menu')}
          </Link>
          <Link to="/contact" style={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            {t('contact')}
          </Link>
          {isStaff && (
            <Link to="/pos" style={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              {t('posCashRegister')}
            </Link>
          )}
          {isAdmin && (
            <Link to="/dashboard" style={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              {t('dashboard')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
