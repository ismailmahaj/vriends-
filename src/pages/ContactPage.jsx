import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitContact } from '../services/contactsService';
import { trackQRScan } from '../services/qrService';

const ContactPage = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Détecter si l'utilisateur arrive via QR code
    const fromQR = searchParams.get('qr') === 'true' || 
                   document.referrer.includes('qr') ||
                   window.location.search.includes('qr');
    
    if (fromQR) {
      trackQRScan();
    }
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

  // URL du QR code : fixe par défaut avec l'URL de production Railway
  // Vous pouvez définir VITE_QR_CODE_URL dans Railway pour utiliser un autre domaine
  // Exemple : VITE_QR_CODE_URL=https://vriends-poperinge.com/contact?qr=true
  // ⚠️ IMPORTANT : Les variables Vite sont injectées au BUILD. Si vous modifiez VITE_QR_CODE_URL,
  // vous devez REDÉPLOYER le frontend pour que le changement prenne effet.
  const getContactUrl = () => {
    const envUrl = import.meta.env.VITE_QR_CODE_URL;
    
    // Log pour déboguer
    console.log('🔍 QR Code URL - Variables:', {
      'VITE_QR_CODE_URL': envUrl || 'non définie',
      'window.location.origin': window.location.origin,
      'hostname': window.location.hostname
    });
    
    // Si une variable d'environnement est définie et non vide, l'utiliser en priorité
    if (envUrl && envUrl.trim() !== '') {
      console.log('✅ Utilisation de VITE_QR_CODE_URL:', envUrl);
      return envUrl.trim();
    }
    
    // En production (pas localhost), utiliser l'URL Railway fixe
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const defaultUrl = 'https://vriends-frontend-production.up.railway.app/contact?qr=true';
      console.log('✅ Utilisation de l\'URL Railway par défaut:', defaultUrl);
      return defaultUrl;
    }
    
    // En développement local, utiliser l'URL actuelle
    const localUrl = `${window.location.origin}/contact?qr=true`;
    console.log('✅ Utilisation de l\'URL locale:', localUrl);
    return localUrl;
  };
  
  const contactUrl = getContactUrl();
  console.log('📱 URL finale du QR Code:', contactUrl);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(contactUrl)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;

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
              <div style={styles.successTitle}>Message envoyé !</div>
              <div style={styles.successText}>
                Merci, votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.
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
                Envoyer un autre message
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
          <h1 style={styles.title}>Contactez-nous</h1>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Message *</label>
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
                J'accepte d'être recontacté(e) par Vriends Poperinge (RGPD)
              </label>
            </div>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Envoi...' : 'Envoyer le message'}
            </button>
          </form>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.qrCard}>
            <img src={qrCodeUrl} alt="QR Code" style={styles.qrImage} />
            <div style={styles.qrText}>Scanner pour accéder au formulaire</div>
            <div style={styles.qrUrl}>{contactUrl}</div>
            <a href={qrCodeUrl} download="qr-code-vriends.png" style={styles.downloadButton}>
              ↓ Télécharger le QR Code
            </a>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>📍</div>
              <div>Rue de la Station, Poperinge</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>⏰</div>
              <div>Lun–Ven 7h30–17h · Sam–Dim 8h–15h</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>✉️</div>
              <div>info@vriendspoperinge.be</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
