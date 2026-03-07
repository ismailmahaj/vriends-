import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitContact } from '../services/contactsService';
import { trackQRScan } from '../services/qrService';
import { getQRCodeImageUrl, getQRCodeUrl } from '../services/settingsService';
import { useLanguage } from '../context/LanguageContext';

const ContactPage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState(null);
  const [destinationUrl, setDestinationUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(true);

  useEffect(() => {
    // Détecter si l'utilisateur arrive via QR code
    const fromQR = searchParams.get('qr') === 'true' || 
                   document.referrer.includes('qr') ||
                   window.location.search.includes('qr');
    
    if (fromQR) {
      trackQRScan();
    }

    // Charger l'URL de l'image QR code depuis l'API (fixe, ne change jamais)
    const loadQRCodeImage = async () => {
      try {
        console.log('🔍 ContactPage: Chargement de l\'image QR code depuis l\'API...');
        const imageUrl = await getQRCodeImageUrl();
        console.log('🔍 ContactPage: Image QR code récupérée:', imageUrl);
        
        if (imageUrl) {
          // Vérifier que l'image pointe vers /qr-redirect
          if (imageUrl.includes('/qr-redirect')) {
            console.log('✅ ContactPage: Image QR code pointe vers /qr-redirect');
            setQrCodeImageUrl(imageUrl);
          } else {
            console.warn('⚠️ ContactPage: Image QR code ne pointe PAS vers /qr-redirect, utilisation du fallback');
            // Ne pas utiliser cette image, utiliser le fallback
            setQrCodeImageUrl(null);
          }
        } else {
          console.warn('⚠️ ContactPage: Aucune image QR code trouvée, utilisation du fallback');
        }
      } catch (error) {
        console.error('❌ ContactPage: Erreur chargement image QR code:', error);
        console.error('❌ ContactPage: Détails:', error.response?.data || error.message);
      }
    };
    
    // Charger l'URL de destination pour l'affichage (celle configurée dans le dashboard)
    const loadDestinationUrl = async () => {
      setLoadingUrl(true);
      try {
        console.log('🔍 ContactPage: Chargement de l\'URL de destination depuis l\'API...');
        const url = await getQRCodeUrl();
        console.log('🔍 ContactPage: URL de destination récupérée depuis API:', url);
        console.log('🔍 ContactPage: Type de url:', typeof url);
        console.log('🔍 ContactPage: url est truthy?', !!url);
        
        if (url && typeof url === 'string' && url.trim() !== '') {
          const trimmedUrl = url.trim();
          console.log('✅ ContactPage: URL de destination définie:', trimmedUrl);
          
          // Vérifier que ce n'est pas l'ancienne URL par défaut
          if (trimmedUrl === 'https://vriends-frontend-production.up.railway.app/contact?qr=true') {
            console.warn('⚠️ ContactPage: L\'URL récupérée est l\'ancienne URL par défaut');
            console.warn('⚠️ ContactPage: Vérifiez que l\'URL est bien configurée dans le dashboard');
          }
          
          // Log pour vérification
          console.log('✅ ContactPage: URL de destination chargée:', trimmedUrl);
          
          setDestinationUrl(trimmedUrl);
        } else {
          console.warn('⚠️ ContactPage: Aucune URL de destination trouvée ou URL vide');
          console.warn('⚠️ ContactPage: url =', url);
          // Ne pas définir destinationUrl, le fallback sera utilisé
        }
      } catch (error) {
        console.error('❌ ContactPage: Erreur chargement URL de destination:', error);
        console.error('❌ ContactPage: Détails erreur:', error.response?.data || error.message);
        // En cas d'erreur, ne pas définir destinationUrl, le fallback sera utilisé
      } finally {
        setLoadingUrl(false);
      }
    };
    
    loadQRCodeImage();
    loadDestinationUrl();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !message) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (!consent) {
      setError('Le consentement est requis');
      return;
    }

    setLoading(true);

    try {
      await submitContact({ name, email, phone, message, consent: true });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  // URL de l'image QR code : utiliser celle stockée en base (pointe directement vers l'URL de destination)
  const getQRCodeImageUrlValue = () => {
    // Si on a une image depuis l'API, l'utiliser
    if (qrCodeImageUrl) {
      console.log('✅ ContactPage: Utilisation de l\'image QR code depuis l\'API');
      return qrCodeImageUrl;
    }
    
    // Si on a l'URL de destination, générer le QR code à la volée
    if (destinationUrl && destinationUrl.trim() !== '') {
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(destinationUrl.trim())}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
      console.log('✅ ContactPage: Génération QR code à la volée vers:', destinationUrl);
      return qrImageUrl;
    }
    
    // Fallback : générer un QR code vers l'URL par défaut
    const defaultUrl = 'https://www.vriendscoffeshop.com/register';
    
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(defaultUrl)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
    console.log('⚠️ ContactPage: Utilisation du fallback (URL par défaut):', defaultUrl);
    return qrImageUrl;
  };
  
  const qrCodeUrl = getQRCodeImageUrlValue();
  
  // URL de destination pour l'affichage (celle configurée dans le dashboard)
  // Toujours afficher l'URL de destination réelle, pas l'URL de redirection
  const displayUrl = (destinationUrl && destinationUrl.trim() !== '' && !loadingUrl)
    ? destinationUrl.trim()
    : 'https://www.vriendscoffeshop.com/register';
  
  console.log('🔍 ContactPage: destinationUrl depuis state:', destinationUrl);
  console.log('🔍 ContactPage: loadingUrl:', loadingUrl);
  console.log('🔍 ContactPage: URL de destination à afficher:', displayUrl);

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      paddingTop: '80px',
      padding: '4rem 2rem'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
      gap: '4rem'
    },
    leftCol: {
      background: '#F7F5F2',
      padding: '3rem'
    },
    eyebrow: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '.2em',
      color: '#3A2E25',
      marginBottom: '1rem'
    },
    title: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '4rem',
      color: '#3A2E25',
      marginBottom: '2rem'
    },
    formGroup: {
      marginBottom: '1.5rem'
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
      color: '#1C1C1C'
    },
    textarea: {
      width: '100%',
      padding: '0.9rem',
      background: '#F7F5F2',
      border: '1.5px solid rgba(58,46,37,.2)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C',
      minHeight: '120px',
      resize: 'vertical'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.8rem',
      marginTop: '1rem'
    },
    button: {
      width: window.innerWidth > 768 ? '100%' : 'auto',
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '1.2rem 2.5rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      marginTop: '1.5rem'
    },
    error: {
      background: '#fdf0ee',
      border: '1px solid #e74c3c',
      color: '#c0392b',
      padding: '1rem',
      marginBottom: '1.5rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem'
    },
    success: {
      textAlign: 'center',
      padding: '3rem'
    },
    successIcon: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: '#4caf50',
      color: '#F7F5F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2.5rem',
      margin: '0 auto 1.5rem'
    },
    successTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '2rem',
      color: '#3A2E25',
      marginBottom: '1rem'
    },
    successText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#1C1C1C',
      opacity: 0.7,
      marginBottom: '2rem'
    },
    rightCol: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    qrCard: {
      background: '#F7F5F2',
      padding: '2.5rem',
      textAlign: 'center'
    },
    qrImage: {
      width: '220px',
      height: '220px',
      margin: '0 auto 1.5rem'
    },
    qrText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      color: '#1C1C1C',
      marginBottom: '0.5rem'
    },
    qrUrl: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.75rem',
      color: '#1C1C1C',
      opacity: 0.6,
      marginBottom: '1.5rem'
    },
    downloadButton: {
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '0.8rem 1.5rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block'
    },
    infoCard: {
      background: '#3A2E25',
      padding: '2.5rem',
      color: '#F7F5F2'
    },
    infoItem: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem'
    },
    infoIcon: {
      fontSize: '1.2rem',
      minWidth: '24px'
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.leftCol}>
            <div style={styles.success}>
              <div style={styles.successIcon}>✓</div>
              <div style={styles.successTitle}>{t('messageSent')}</div>
              <div style={styles.successText}>
                {t('messageSuccess')}
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setName('');
                  setEmail('');
                  setPhone('');
                  setMessage('');
                  setConsent(false);
                }}
                style={styles.button}
              >
                {t('sendAnother')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.leftCol}>
          <div style={styles.eyebrow}>Vriends Poperinge</div>
          <h1 style={styles.title}>{t('contactUs')}</h1>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('name')} {t('required')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('email')} {t('required')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('message')} {t('required')}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={styles.textarea}
                rows={5}
              />
            </div>
            <div style={styles.checkbox}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#1C1C1C' }}>
                {t('consent')}
              </label>
            </div>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? t('sending') : t('send')}
            </button>
          </form>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.qrCard}>
            <img src={qrCodeUrl} alt="QR Code" style={styles.qrImage} />
            <div style={styles.qrText}>{t('scanQR')}</div>
            <div style={styles.qrUrl}>{displayUrl}</div>
            <a href={qrCodeUrl} download="qr-code-vriends.png" style={styles.downloadButton}>
              {t('downloadQR')}
            </a>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>📍</div>
              <div>{t('address')}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>⏰</div>
              <div>{t('hours')}</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>✉️</div>
              <div>{t('emailContact')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
