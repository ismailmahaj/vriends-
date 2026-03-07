import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQRCodeUrl } from '../services/settingsService';
import { trackQRScan } from '../services/qrService';

const QRRedirectPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      // Tracker le scan du QR code
      trackQRScan();

      try {
        // Charger l'URL depuis l'API
        const targetUrl = await getQRCodeUrl();
        
        if (targetUrl) {
          // Si l'URL est complète (avec https://), rediriger vers cette URL
          if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
            window.location.href = targetUrl;
          } else {
            // Sinon, c'est un chemin relatif, utiliser navigate
            navigate(targetUrl);
          }
        } else {
          // Fallback : rediriger vers /contact?qr=true
          navigate('/contact?qr=true');
        }
      } catch (error) {
        console.error('Erreur redirection QR code:', error);
        // Fallback en cas d'erreur
        navigate('/contact?qr=true');
      }
    };

    redirect();
  }, [navigate]);

  // Afficher un message de chargement pendant la redirection
  return (
    <div style={{
      minHeight: '100vh',
      background: '#E6DCCB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        textAlign: 'center',
        color: '#3A2E25'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div>Redirection en cours...</div>
      </div>
    </div>
  );
};

export default QRRedirectPage;
