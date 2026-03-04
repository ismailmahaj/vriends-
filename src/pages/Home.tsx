import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <div className="home-container">
        <div className="home-hero">
          <h1 className="home-title">Vriends Poperinge</h1>
          <p className="home-subtitle">
            Votre café-restaurant de quartier
          </p>
          <p className="home-description">
            Commandez à l'avance, bénéficiez de réductions locales et récupérez rapidement votre commande.
          </p>
          <div className="home-advantages">
            <div className="advantage">
              <h3>📱 Commande à l'avance</h3>
              <p>Évitez l'attente, commandez en ligne</p>
            </div>
            <div className="advantage">
              <h3>💰 Réductions locales</h3>
              <p>Bénéficiez de réductions si vous êtes local</p>
            </div>
            <div className="advantage">
              <h3>⚡ Retrait rapide</h3>
              <p>Récupérez votre commande en quelques minutes</p>
            </div>
          </div>
          <Link to="/menu" className="btn-primary">
            Commander maintenant
          </Link>
        </div>
      </div>
    </div>
  );
}
