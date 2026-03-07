import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const HomePage = () => {
  const { t } = useLanguage();
  
  useEffect(() => {
    document.body.style.background = '#E6DCCB';
  }, []);

  const styles = {
    page: {
      minHeight: '100vh',
      paddingTop: '80px',
      animation: 'fadeUp 0.6s ease-out'
    },
    hero: {
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
      height: window.innerWidth > 768 ? '100vh' : 'auto',
      minHeight: '100vh'
    },
    leftCol: {
      background: '#E6DCCB',
      padding: '6rem 4rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative'
    },
    eyebrow: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '2rem',
      animation: 'fadeUp 0.6s ease-out 0s'
    },
    eyebrowLine: {
      width: '2.5rem',
      height: '1px',
      background: '#3A2E25'
    },
    eyebrowText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '.2em',
      color: '#3A2E25'
    },
    title: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 'clamp(3rem, 6vw, 5.5rem)',
      fontWeight: 300,
      color: '#3A2E25',
      marginBottom: '1.5rem',
      lineHeight: 1.2,
      animation: 'fadeUp 0.6s ease-out 0.1s'
    },
    titleItalic: {
      fontStyle: 'italic'
    },
    subtitle: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      lineHeight: 1.7,
      color: '#1C1C1C',
      opacity: 0.7,
      maxWidth: '38ch',
      marginBottom: '3rem',
      animation: 'fadeUp 0.6s ease-out 0.2s'
    },
    buttons: {
      display: 'flex',
      gap: '1rem',
      animation: 'fadeUp 0.6s ease-out 0.3s'
    },
    btnPrimary: {
      background: '#3A2E25',
      color: '#F7F5F2',
      padding: '.9rem 2.2rem',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
      transition: 'background 0.2s'
    },
    btnSecondary: {
      background: 'transparent',
      color: '#3A2E25',
      padding: '.9rem 2.2rem',
      border: '1.5px solid #3A2E25',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
      transition: 'all 0.2s'
    },
    rightCol: {
      background: '#3A2E25',
      padding: '6rem 4rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    badge: {
      position: 'absolute',
      top: '2rem',
      right: '2rem',
      width: '110px',
      height: '110px',
      border: '1.5px solid rgba(247,245,242,.25)',
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#F7F5F2'
    },
    badgePercent: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '2.4rem',
      fontWeight: 300
    },
    badgeText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.62rem',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      marginTop: '0.3rem'
    },
    circle1: {
      position: 'absolute',
      top: '-80px',
      left: '-80px',
      width: '380px',
      height: '380px',
      border: '1px solid rgba(247,245,242,.07)',
      borderRadius: '50%'
    },
    circle2: {
      position: 'absolute',
      bottom: '-120px',
      right: '-120px',
      width: '500px',
      height: '500px',
      border: '1px solid rgba(247,245,242,.05)',
      borderRadius: '50%'
    },
    tag: {
      background: 'rgba(247,245,242,.08)',
      color: 'rgba(247,245,242,.6)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.72rem',
      textTransform: 'uppercase',
      letterSpacing: '.15em',
      padding: '.4rem 1rem',
      display: 'inline-block',
      marginBottom: '3rem'
    },
    quote: {
      fontFamily: "'Cormorant Garamond', serif",
      fontStyle: 'italic',
      fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
      fontWeight: 300,
      color: '#F7F5F2',
      marginBottom: '4rem',
      lineHeight: 1.3
    },
    hours: {
      display: 'flex',
      gap: '3rem',
      paddingTop: '2rem',
      borderTop: '1px solid rgba(247,245,242,.15)'
    },
    hoursItem: {
      color: 'rgba(247,245,242,.7)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem'
    },
    features: {
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
      borderTop: '1px solid rgba(58,46,37,.12)'
    },
    feature: {
      padding: '3.5rem 3rem',
      borderRight: window.innerWidth > 768 ? '1px solid rgba(58,46,37,.12)' : 'none',
      borderBottom: window.innerWidth <= 768 ? '1px solid rgba(58,46,37,.12)' : 'none'
    },
    featureNum: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '3rem',
      opacity: 0.2,
      color: '#3A2E25',
      marginBottom: '1rem'
    },
    featureTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.5rem',
      color: '#3A2E25',
      marginBottom: '0.5rem'
    },
    featureText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.95rem',
      color: '#1C1C1C',
      opacity: 0.7,
      lineHeight: 1.6
    },
    menuPreview: {
      background: '#F7F5F2',
      padding: '7rem 4rem'
    },
    menuHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: '3rem'
    },
    menuLabel: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '.15em',
      color: '#3A2E25',
      opacity: 0.6
    },
    menuTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '3rem',
      color: '#3A2E25',
      marginTop: '0.5rem'
    },
    menuLink: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      color: '#3A2E25',
      textDecoration: 'none'
    },
    productsGrid: {
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? 'repeat(4, 1fr)' : '1fr',
      gap: '1.5px',
      background: 'rgba(58,46,37,.08)'
    },
    productCard: {
      background: '#F7F5F2',
      padding: '2.4rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    },
    productEmoji: {
      fontSize: '2.4rem',
      marginBottom: '1rem'
    },
    productName: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.2rem',
      color: '#3A2E25',
      marginBottom: '0.5rem'
    },
    productDesc: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem',
      color: '#1C1C1C',
      opacity: 0.6,
      marginBottom: '1rem'
    },
    productPrice: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '1.5rem',
      color: '#3A2E25'
    },
    localProgram: {
      background: '#3A2E25',
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
      padding: '6rem 4rem',
      gap: '4rem'
    },
    localTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '3rem',
      color: '#F7F5F2',
      marginBottom: '1.5rem'
    },
    localText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: 'rgba(247,245,242,.7)',
      lineHeight: 1.7
    },
    perks: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    perk: {
      border: '1px solid rgba(247,245,242,.2)',
      padding: '2rem',
      display: 'flex',
      gap: '1.5rem',
      alignItems: 'center'
    },
    perkIcon: {
      fontSize: '2rem',
      color: '#F7F5F2'
    },
    perkText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '1rem',
      color: '#F7F5F2'
    },
    footer: {
      background: '#1C1C1C',
      padding: '4rem',
      display: 'grid',
      gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
      gap: '3rem'
    },
    footerSection: {
      color: 'rgba(247,245,242,.6)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem'
    },
    footerBottom: {
      background: '#1C1C1C',
      padding: '2rem 4rem',
      textAlign: 'center',
      color: 'rgba(247,245,242,.4)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.85rem'
    }
  };

  const products = [
    { emoji: '☕', name: 'Menu Phare', desc: 'Notre sélection du jour', price: '7€' },
    { emoji: '🥐', name: 'Croissant', desc: 'Beurre AOP', price: '2.50€' },
    { emoji: '🍊', name: 'Jus Zumex', desc: '100% pur jus', price: '3.50€' },
    { emoji: '🧇', name: 'Gaufre-Crêpe', desc: 'Maison', price: '3€' }
  ];

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.leftCol}>
          <div style={styles.eyebrow}>
            <div style={styles.eyebrowLine}></div>
            <div style={styles.eyebrowText}>{t('eyebrow')}</div>
          </div>
          <h1 style={styles.title}>
            {t('title1')}<br />
            <span style={styles.titleItalic}>{t('title2')}</span>
          </h1>
          <p style={styles.subtitle}>
            {t('subtitle')}
          </p>
          <div style={styles.buttons}>
            <Link to="/menu" style={styles.btnPrimary}>{t('orderNow')}</Link>
            <Link to="/menu" style={styles.btnSecondary}>{t('viewMenu')}</Link>
          </div>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.circle1}></div>
          <div style={styles.circle2}></div>
          <div style={styles.badge}>
            <div style={styles.badgePercent}>{t('discountBadge')}</div>
            <div style={styles.badgeText}>{t('forLocals')}</div>
          </div>
          <div style={styles.tag}>{t('openToday')}</div>
          <div style={styles.quote}>
            {t('quote')}
          </div>
          <div style={styles.hours}>
            <div style={styles.hoursItem}>
              <div>{t('hoursWeek')}</div>
              <div style={{ marginTop: '0.3rem' }}>{t('hoursWeekTime')}</div>
            </div>
            <div style={styles.hoursItem}>
              <div>{t('hoursWeekend')}</div>
              <div style={{ marginTop: '0.3rem' }}>{t('hoursWeekendTime')}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.features}>
        <div style={styles.feature}>
          <div style={styles.featureNum}>01</div>
          <div style={styles.featureTitle}>{t('feature1Title')}</div>
          <div style={styles.featureText}>
            {t('feature1Text')}
          </div>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureNum}>02</div>
          <div style={styles.featureTitle}>{t('feature2Title')}</div>
          <div style={styles.featureText}>
            {t('feature2Text')}
          </div>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureNum}>03</div>
          <div style={styles.featureTitle}>{t('feature3Title')}</div>
          <div style={styles.featureText}>
            {t('feature3Text')}
          </div>
        </div>
      </div>

      <div style={styles.menuPreview}>
        <div style={styles.menuHeader}>
          <div>
            <div style={styles.menuLabel}>{t('ourSelection')}</div>
            <div style={styles.menuTitle}>{t('menuOfTheMoment')}</div>
          </div>
          <Link to="/menu" style={styles.menuLink}>{t('viewAllMenu')}</Link>
        </div>
        <div style={styles.productsGrid}>
          {products.map((product, i) => (
            <div key={i} style={styles.productCard}>
              <div style={styles.productEmoji}>{product.emoji}</div>
              <div style={styles.productName}>{product.name}</div>
              <div style={styles.productDesc}>{product.desc}</div>
              <div style={styles.productPrice}>{product.price}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.localProgram}>
        <div>
          <div style={styles.localTitle}>{t('youAreFromPoperinge')}</div>
          <div style={styles.localText}>
            {t('localAdvantages')}
          </div>
        </div>
        <div style={styles.perks}>
          <div style={styles.perk}>
            <div style={styles.perkIcon}>%</div>
            <div style={styles.perkText}>{t('autoDiscount')}</div>
          </div>
          <div style={styles.perk}>
            <div style={styles.perkIcon}>★</div>
            <div style={styles.perkText}>{t('priorityAccess')}</div>
          </div>
          <div style={styles.perk}>
            <div style={styles.perkIcon}>♥</div>
            <div style={styles.perkText}>{t('community')}</div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerSection}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#F7F5F2', marginBottom: '1rem' }}>
            Vriends <span style={{ fontStyle: 'italic', fontWeight: 300 }}>Poperinge</span>
          </div>
          <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
            Votre café de quartier
          </div>
        </div>
        <div style={styles.footerSection}>
          <div style={{ marginBottom: '1rem', color: '#F7F5F2' }}>Navigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/menu" style={{ color: 'rgba(247,245,242,.6)', textDecoration: 'none' }}>{t('menu')}</Link>
            <Link to="/contact" style={{ color: 'rgba(247,245,242,.6)', textDecoration: 'none' }}>{t('contact')}</Link>
          </div>
        </div>
        <div style={styles.footerSection}>
          <div style={{ marginBottom: '1rem', color: '#F7F5F2' }}>{t('contact')}</div>
          <div>{t('emailContact')}</div>
        </div>
      </div>
      <div style={styles.footerBottom}>
        © 2025 Vriends Poperinge
      </div>
    </div>
  );
};

export default HomePage;
