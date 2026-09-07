/**
 * Analyse faisabilité bridge impression silencieuse — documentation seule.
 * Aucun bridge n'est intégré dans ce dépôt.
 */
export const PRINT_BRIDGE_ANALYSIS = {
  existingBridge: false,
  browserSilentPrint: false,
  currentSolution: 'window.print() + duplication DOM pour copies + CSS 58/80 mm',
  recommendedNextSteps: [
    {
      id: 'kiosk',
      name: 'Chrome kiosk + --kiosk-printing',
      silent: true,
      notes: 'Machine caisse dédiée ; démarrage OS en mode kiosque.',
    },
    {
      id: 'qz-tray',
      name: 'QZ Tray',
      silent: true,
      notes: 'Agent local signé ; API JS depuis le POS.',
    },
    {
      id: 'printnode',
      name: 'PrintNode',
      silent: true,
      notes: 'Service cloud + client local ; clé API serveur uniquement.',
    },
    {
      id: 'local-bridge',
      name: 'Service local HTTP (localhost:9100)',
      silent: true,
      notes: 'Petit daemon à installer sur la caisse ; hors scope tant que non validé.',
    },
  ],
};
