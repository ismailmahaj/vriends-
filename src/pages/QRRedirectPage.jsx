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
        console.log('🔍 QRRedirectPage: Chargement de l\'URL depuis l\'API...');
        
        // Charger l'URL depuis l'API
        const targetUrl = await getQRCodeUrl();
        
        console.log('🔍 QRRedirectPage: URL récupérée:', targetUrl);
        
        if (targetUrl) {
          // Si l'URL est complète (avec https://), rediriger vers cette URL
          if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
            console.log('✅ QRRedirectPage: Redirection vers URL externe:', targetUrl);
            window.location.href = targetUrl;
            return; // Important : arrêter l'exécution après redirection
          } else {
            // Sinon, c'est un chemin relatif, utiliser navigate
            console.log('✅ QRRedirectPage: Redirection vers chemin relatif:', targetUrl);
            navigate(targetUrl, { replace: true });
            return;
          }
        } else {
          // Fallback : rediriger vers /contact?qr=true
          console.log('⚠️ QRRedirectPage: Aucune URL trouvée, redirection vers /contact?qr=true');
          navigate('/contact?qr=true', { replace: true });
        }
      } catch (error) {
        console.error('❌ QRRedirectPage: Erreur redirection QR code:', error);
        // Fallback en cas d'erreur
        navigate('/contact?qr=true', { replace: true });
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
