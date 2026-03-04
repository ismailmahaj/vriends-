import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localStatus, setLocalStatus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
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

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#E6DCCB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '80px',
      padding: '2rem'
    },
    card: {
      maxWidth: '440px',
      width: '100%',
      background: '#F7F5F2',
      padding: '3rem 2.5rem'
    },
    header: {
      marginBottom: '2.5rem',
      textAlign: 'center'
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
      color: '#1C1C1C'
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
      marginTop: '0.5rem'
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
      background: '#e8f5e9',
      border: '1px solid #4caf50',
      color: '#2e7d32',
      padding: '1.5rem',
      marginBottom: '1.5rem',
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
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.success}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>✓</div>
            <div>Compte créé ! Vous pouvez vous connecter.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>Vriends <span style={{ fontStyle: 'italic', fontWeight: 300 }}>Poperinge</span></div>
          <h2 style={styles.title}>Inscription</h2>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nom complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirmer mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
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
              Je suis résident(e) de Poperinge
            </label>
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
        <div style={styles.link}>
          Déjà un compte ? <Link to="/login" style={styles.linkA}>Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
