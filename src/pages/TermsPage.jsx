import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

/** Variables juridiques — à remplacer avant ouverture publique. Ne pas inventer. */
export const LEGAL_PLACEHOLDERS = {
  legalName: '[NOM LÉGAL DU COMMERCE]',
  companyNumber: '[NUMÉRO D’ENTREPRISE]',
  vat: '[NUMÉRO DE TVA]',
  address: '[ADRESSE DU SIÈGE]',
  email: '[E-MAIL DE CONTACT]',
  court: '[TRIBUNAL COMPÉTENT]',
};

export default function TermsPage() {
  const { t } = useLanguage();
  const P = LEGAL_PLACEHOLDERS;
  return (
    <LegalShell title={t('termsTitle')}>
      <p className="legal-warn">
        Document modèle. Remplacer toutes les variables entre crochets avant publication.
      </p>
      <p>
        <strong>{P.legalName}</strong> — {P.address}
      </p>
      <p>
        N° entreprise : {P.companyNumber} · TVA : {P.vat}
      </p>
      <p>Contact : {P.email}</p>
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales régissent les commandes passées via le site / menu
        Vriends Poperinge (click &amp; collect et services associés).
      </p>
      <h2>2. Commandes</h2>
      <p>
        Toute commande implique l’acceptation des présentes conditions. Le commerçant peut
        temporairement suspendre la prise de commandes.
      </p>
      <h2>3. Prix et paiement</h2>
      <p>
        Les prix affichés s’entendent en euros. Les options et suppléments sélectionnés sont
        ajoutés au prix du produit.
      </p>
      <h2>4. Retrait</h2>
      <p>
        Le client s’engage à retirer sa commande à l’heure indiquée. Des retards peuvent entraîner
        une dégradation de la qualité des produits.
      </p>
      <h2>5. Données personnelles</h2>
      <p>
        Les données collectées sont traitées conformément à la{' '}
        <Link to="/privacy">politique de confidentialité</Link>.
      </p>
      <h2>6. Litiges</h2>
      <p>Tribunal compétent : {P.court}.</p>
      <p style={{ opacity: 0.65, marginTop: '2rem' }}>Version 1.0</p>
    </LegalShell>
  );
}

export function PrivacyPage() {
  const { t } = useLanguage();
  const P = LEGAL_PLACEHOLDERS;
  return (
    <LegalShell title={t('privacyTitle')}>
      <p className="legal-warn">
        Document modèle. Remplacer toutes les variables entre crochets avant publication.
      </p>
      <p>
        Responsable du traitement : <strong>{P.legalName}</strong> ({P.email}).
      </p>
      <p>Siège : {P.address}</p>
      <p>
        N° entreprise : {P.companyNumber} · TVA : {P.vat}
      </p>
      <h2>Données collectées</h2>
      <p>
        Identité, e-mail, téléphone, adresse de livraison éventuelle, contenu des commandes et
        commentaires.
      </p>
      <h2>Finalités</h2>
      <p>Exécution des commandes, service client, obligations légales comptables.</p>
      <h2>Conservation</h2>
      <p>Les données de commande sont conservées le temps nécessaire aux obligations légales.</p>
      <h2>Droits</h2>
      <p>
        Vous pouvez demander l’accès, la rectification ou la suppression de vos données via {P.email}.
      </p>
    </LegalShell>
  );
}

function LegalShell({ title, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#E6DCCB', padding: '6rem 1.5rem 3rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#F7F5F2', padding: '2rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", color: '#3A2E25', fontSize: '2.4rem' }}>
          {title}
        </h1>
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#1C1C1C', lineHeight: 1.6 }}>
          <style>{`.legal-warn{background:#fdf0ee;border:1px solid #e74c3c;color:#c0392b;padding:.75rem 1rem;margin-bottom:1.25rem;font-size:.9rem}`}</style>
          {children}
        </div>
        <p style={{ marginTop: '2rem' }}>
          <Link to="/" style={{ color: '#3A2E25' }}>
            ← Accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
