import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQRCodeUrl } from '../services/settingsService';
import { trackQRScan } from '../services/qrService';

const QRRedirectPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      // Tracker le scan du QR code
      try {
        await trackQRScan();
      } catch (error) {
        console.warn('⚠️ Erreur tracking QR scan (non bloquant):', error);
      }

      try {
        console.log('🔍 QRRedirectPage: Début de la redirection...');
        console.log('🔍 QRRedirectPage: Chargement de l\'URL depuis l\'API...');
        
        // Charger l'URL depuis l'API
        const targetUrl = await getQRCodeUrl();
        
        console.log('🔍 QRRedirectPage: URL récupérée depuis API:', targetUrl);
        console.log('🔍 QRRedirectPage: Type de targetUrl:', typeof targetUrl);
        console.log('🔍 QRRedirectPage: targetUrl est truthy?', !!targetUrl);
        console.log('🔍 QRRedirectPage: targetUrl.trim() !== \'\'?', targetUrl ? targetUrl.trim() !== '' : false);
        
        if (targetUrl && typeof targetUrl === 'string' && targetUrl.trim() !== '') {
          const trimmedUrl = targetUrl.trim();
          console.log('🔍 QRRedirectPage: URL nettoyée:', trimmedUrl);
          console.log('🔍 QRRedirectPage: trimmedUrl.startsWith(\'https://\')?', trimmedUrl.startsWith('https://'));
          console.log('🔍 QRRedirectPage: trimmedUrl.startsWith(\'http://\')?', trimmedUrl.startsWith('http://'));
          
          // Si l'URL est complète (avec https://), rediriger vers cette URL
          if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
            console.log('✅ QRRedirectPage: Redirection vers URL externe:', trimmedUrl);
            console.log('✅ QRRedirectPage: Exécution de window.location.href =', trimmedUrl);
            // Utiliser window.location.replace pour éviter que l'utilisateur puisse revenir en arrière
            window.location.replace(trimmedUrl);
            return; // Important : arrêter l'exécution après redirection
          } else {
            // Sinon, c'est un chemin relatif, utiliser navigate
            console.log('✅ QRRedirectPage: Redirection vers chemin relatif:', trimmedUrl);
            navigate(trimmedUrl, { replace: true });
            return;
          }
        } else {
          // Fallback : rediriger vers /contact?qr=true
          console.log('⚠️ QRRedirectPage: Aucune URL valide trouvée');
          console.log('⚠️ QRRedirectPage: targetUrl =', targetUrl);
          console.log('⚠️ QRRedirectPage: Redirection vers /contact?qr=true (fallback)');
          navigate('/contact?qr=true', { replace: true });
        }
      } catch (error) {
        console.error('❌ QRRedirectPage: Erreur redirection QR code:', error);
        console.error('❌ QRRedirectPage: Détails erreur:', error.response || error.message);
        console.error('❌ QRRedirectPage: Stack:', error.stack);
        // Fallback en cas d'erreur
        console.log('⚠️ QRRedirectPage: Redirection vers /contact?qr=true (fallback erreur)');
        navigate('/contact?qr=true', { replace: true });
      }
    };

    // Délai court pour s'assurer que le composant est monté
    const timeoutId = setTimeout(() => {
      redirect();
    }, 100);

    return () => clearTimeout(timeoutId);
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
