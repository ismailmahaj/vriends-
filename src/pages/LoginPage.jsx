import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      authLogin(response.user, response.token);
      navigate(response.user.role === 'admin' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>Vriends <span style={{ fontStyle: 'italic', fontWeight: 300 }}>Poperinge</span></div>
          <h2 style={styles.title}>Connexion</h2>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
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
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <div style={styles.link}>
          Pas encore de compte ? <Link to="/register" style={styles.linkA}>Créer un compte</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
