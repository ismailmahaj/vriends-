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
        
        console.log('🔍 QRRedirectPage: URL récupérée depuis API:', targetUrl);
        console.log('🔍 QRRedirectPage: Type de targetUrl:', typeof targetUrl);
        console.log('🔍 QRRedirectPage: targetUrl est truthy?', !!targetUrl);
        
        if (targetUrl && targetUrl.trim() !== '') {
          const trimmedUrl = targetUrl.trim();
          console.log('🔍 QRRedirectPage: URL nettoyée:', trimmedUrl);
          
          // Si l'URL est complète (avec https://), rediriger vers cette URL
          if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
            console.log('✅ QRRedirectPage: Redirection vers URL externe:', trimmedUrl);
            window.location.href = trimmedUrl;
            return; // Important : arrêter l'exécution après redirection
          } else {
            // Sinon, c'est un chemin relatif, utiliser navigate
            console.log('✅ QRRedirectPage: Redirection vers chemin relatif:', trimmedUrl);
            navigate(trimmedUrl, { replace: true });
            return;
          }
        } else {
          // Fallback : rediriger vers /contact?qr=true
          console.log('⚠️ QRRedirectPage: Aucune URL valide trouvée (targetUrl:', targetUrl, '), redirection vers /contact?qr=true');
          navigate('/contact?qr=true', { replace: true });
        }
      } catch (error) {
        console.error('❌ QRRedirectPage: Erreur redirection QR code:', error);
        console.error('❌ QRRedirectPage: Détails erreur:', error.response || error.message);
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
