import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function SiteFooter({ dark = false }) {
  const { t } = useLanguage();
  const color = dark ? '#F7F5F2' : '#3A2E25';
  const muted = dark ? 'rgba(247,245,242,.7)' : 'rgba(28,28,28,.65)';

  return (
    <footer
      style={{
        marginTop: '3rem',
        padding: '2rem 1.5rem',
        borderTop: dark ? '1px solid rgba(247,245,242,.15)' : '1px solid rgba(58,46,37,.12)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.85rem',
        color: muted,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem 1.5rem',
        justifyContent: 'center',
      }}
    >
      <Link to="/terms" style={{ color }} target="_blank" rel="noopener noreferrer">
        {t('termsTitle')}
      </Link>
      <Link to="/privacy" style={{ color }} target="_blank" rel="noopener noreferrer">
        {t('privacyTitle')}
      </Link>
      <Link to="/contact" style={{ color }}>
        {t('contact')}
      </Link>
    </footer>
  );
}
