import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import { useLanguage } from '../context/LanguageContext';

const RegisterPage = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [localStatus, setLocalStatus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showDiscountMessage, setShowDiscountMessage] = useState(false);
  const [bannerHighlight, setBannerHighlight] = useState(false);
  const navigate = useNavigate();

  // Vérifier si le popup doit être affiché au chargement
  useEffect(() => {
    const popupDismissed = localStorage.getItem('registerPopupDismissed');
    if (!popupDismissed) {
      setTimeout(() => setShowPopup(true), 500);
    }
  }, []);

  // Détecter automatiquement Poperinge dans la ville
  useEffect(() => {
    const cityLower = city.toLowerCase().trim();
    const isPoperinge = cityLower === 'poperinge' || cityLower.includes('poperinge');
    
    if (isPoperinge && city.length > 0) {
      setLocalStatus(true);
      setShowDiscountMessage(true);
      setBannerHighlight(true);
      
      // Animation confetti (simulation avec bounce)
      setTimeout(() => setBannerHighlight(false), 2000);
    } else if (city.length > 0 && !isPoperinge) {
      setShowDiscountMessage(false);
      setLocalStatus(false);
    }
  }, [city]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await register(name, email, password, localStatus);
      console.log('Inscription réussie:', response);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Erreur inscription:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || "Erreur d'inscription";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('registerPopupDismissed', 'true');
    setShowPopup(false);
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      paddingTop: '80px',
      padding: '2rem',
      position: 'relative'
    },
    banner: {
      maxWidth: '1200px',
      margin: '0 auto 2rem',
      background: 'linear-gradient(135deg, #FFB6C1 0%, #FFE4E1 50%, #F5DEB3 100%)',
      borderRadius: '20px',
      padding: '1.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
      boxShadow: '0 4px 20px rgba(255, 182, 193, 0.3)',
      border: '2px solid #FFB6C1',
      transform: bannerHighlight ? 'scale(1.02)' : 'scale(1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer'
    },
    bannerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      flex: 1
    },
    bannerIcon: {
      fontSize: '2.5rem',
      animation: bannerHighlight ? 'bounce 0.6s ease' : 'none'
    },
    bannerText: {
      flex: 1
    },
    bannerTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      fontWeight: 600,
      color: '#8B4513',
      marginBottom: '0.3rem'
    },
    bannerSubtitle: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      color: '#654321',
      opacity: 0.9
    },
    bannerDiscount: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '3rem',
      fontWeight: 700,
      color: '#8B4513',
      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
      lineHeight: 1
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    card: {
      maxWidth: '100%',
      background: '#F7F5F2',
      padding: '3rem 2.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(58,46,37,0.1)'
    },
    header: {
      marginBottom: '2.5rem',
      textAlign: 'center',
      position: 'relative'
    },
    logo: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.8rem',
      fontWeight: 600,
      color: '#3A2E25',
      marginBottom: '1rem'
    },
    title: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '2.4rem',
      color: '#3A2E25'
    },
    discountBadge: {
      position: 'absolute',
      top: '-10px',
      right: '-10px',
      background: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
      color: '#F7F5F2',
      padding: '0.5rem 1rem',
      borderRadius: '50px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      boxShadow: '0 4px 10px rgba(139, 69, 19, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transform: 'rotate(-5deg)',
      border: '2px solid #F5DEB3'
    },
    formGroup: {
      marginBottom: '1.8rem'
    },
    label: {
      display: 'block',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.78rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      color: '#3A2E25',
      marginBottom: '0.6rem',
      fontWeight: 500
    },
    input: {
      width: '100%',
      padding: '0.9rem',
      background: '#F7F5F2',
      border: '1.5px solid rgba(58,46,37,.2)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C',
      borderRadius: '4px',
      transition: 'border-color 0.3s ease'
    },
    discountMessage: {
      background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
      border: '2px solid #4CAF50',
      borderRadius: '12px',
      padding: '1.2rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      animation: showDiscountMessage ? 'slideIn 0.5s ease' : 'none'
    },
    discountMessageIcon: {
      fontSize: '2rem',
      animation: showDiscountMessage ? 'bounce 0.6s ease' : 'none'
    },
    discountMessageText: {
      flex: 1,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      color: '#2E7D32',
      fontWeight: 500
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      marginTop: '1rem'
    },
    checkboxInput: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    button: {
      width: '100%',
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '1rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      marginTop: '0.5rem',
      borderRadius: '4px',
      transition: 'background 0.3s ease'
    },
    error: {
      background: '#fdf0ee',
      border: '1px solid #e74c3c',
      color: '#c0392b',
      padding: '1rem',
      marginBottom: '1.5rem',
      borderRadius: '8px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem'
    },
    success: {
      background: '#e8f5e9',
      border: '1px solid #4caf50',
      color: '#2e7d32',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      borderRadius: '8px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      textAlign: 'center'
    },
    link: {
      textAlign: 'center',
      marginTop: '2rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      color: '#1C1C1C'
    },
    linkA: {
      color: '#3A2E25',
      textDecoration: 'none',
      fontWeight: 500
    },
    popup: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem',
      animation: 'fadeIn 0.3s ease'
    },
    popupContent: {
      background: '#F7F5F2',
      borderRadius: '20px',
      padding: '2.5rem',
      maxWidth: '500px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.4s ease'
    },
    popupIcon: {
      fontSize: '4rem',
      marginBottom: '1rem',
      animation: 'bounce 0.6s ease'
    },
    popupTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '2rem',
      color: '#3A2E25',
      marginBottom: '1rem'
    },
    popupText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C',
      marginBottom: '2rem',
      lineHeight: 1.6
    },
    popupButtons: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center'
    },
    popupButton: {
      padding: '0.8rem 2rem',
      border: 'none',
      borderRadius: '8px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    popupButtonPrimary: {
      background: '#3A2E25',
      color: '#F7F5F2'
    },
    popupButtonSecondary: {
      background: 'transparent',
      color: '#3A2E25',
      border: '1.5px solid #3A2E25'
    }
  };

  // Styles CSS pour animations et responsive
  const animationStyles = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .promo-banner:hover {
      transform: scale(1.02) !important;
      box-shadow: 0 6px 25px rgba(255, 182, 193, 0.4) !important;
    }
    .submit-button:hover {
      background: #1C1C1C !important;
    }
    .form-input:focus {
      outline: none;
      border-color: #3A2E25;
    }
    @media (max-width: 768px) {
      .promo-banner {
        flex-direction: column !important;
        text-align: center !important;
        padding: 1.2rem 1.5rem !important;
      }
      .banner-content {
        flex-direction: column !important;
        gap: 1rem !important;
      }
      .banner-discount {
        font-size: 2.5rem !important;
        margin-top: 0.5rem;
      }
    }
  `;

  if (success) {
    return (
      <div style={styles.page}>
        <style>{animationStyles}</style>
        <div style={styles.card}>
          <div style={styles.success}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>✓</div>
            <div>{t('accountCreated')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{animationStyles}</style>
      
      {/* Bannière promotionnelle */}
      <div style={styles.banner} className="promo-banner">
        <div style={styles.bannerContent} className="banner-content">
          <div style={styles.bannerIcon}>🍪</div>
          <div style={styles.bannerText}>
            <div style={styles.bannerTitle}>🎉 {t('specialOffer')}</div>
            <div style={styles.bannerSubtitle}>
              {t('localOfferText')}
            </div>
          </div>
        </div>
        <div style={styles.bannerDiscount} className="banner-discount">-10%</div>
      </div>

      {/* Popup d'accueil */}
      {showPopup && (
        <div style={styles.popup} onClick={handleClosePopup}>
          <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.popupIcon}>🍪</div>
            <h2 style={styles.popupTitle}>{t('localOffer')}</h2>
            <p style={styles.popupText}>
              {t('localOfferText')}
            </p>
            <div style={styles.popupButtons}>
              <button
                style={{ ...styles.popupButton, ...styles.popupButtonPrimary }}
                onClick={handleClosePopup}
              >
                {t('registerButton')}
              </button>
              <button
                style={{ ...styles.popupButton, ...styles.popupButtonSecondary }}
                onClick={handleDontShowAgain}
              >
                Fermer
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button
                style={{
                  ...styles.popupButtonSecondary,
                  ...styles.popupButton,
                  fontSize: '0.8rem',
                  padding: '0.5rem 1rem'
                }}
                onClick={handleDontShowAgain}
              >
                {t('dontShowAgain')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.logo}>
              Vriends <span style={{ fontStyle: 'italic', fontWeight: 300 }}>Poperinge</span>
            </div>
            <h2 style={styles.title}>
              {t('register')}
              {localStatus && (
                <span style={styles.discountBadge}>
                  🏷 -10% Poperinge
                </span>
              )}
            </h2>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}
          
          {/* Message de réduction automatique */}
          {showDiscountMessage && (
            <div style={styles.discountMessage}>
              <div style={styles.discountMessageIcon}>🎉</div>
              <div style={styles.discountMessageText}>
                {t('discountMessage')}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('fullName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('addressField')}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={styles.input}
                className="form-input"
                placeholder="Rue et numéro"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('city')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={styles.input}
                className="form-input"
                placeholder="Poperinge"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('postalCode')}</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                style={styles.input}
                className="form-input"
                placeholder="8970"
                maxLength="5"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={styles.input}
                className="form-input"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
            
            <div style={styles.checkbox}>
              <input
                type="checkbox"
                checked={localStatus}
                onChange={(e) => setLocalStatus(e.target.checked)}
                style={styles.checkboxInput}
              />
              <label style={{ ...styles.label, margin: 0, textTransform: 'none', fontSize: '0.9rem' }}>
                {t('localResident')}
              </label>
            </div>
            
            <button type="submit" disabled={loading} style={styles.button} className="submit-button">
              {loading ? t('registering') : t('registerButton')}
            </button>
          </form>
          
          <div style={styles.link}>
            {t('alreadyAccount')} <Link to="/login" style={styles.linkA}>{t('login')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
