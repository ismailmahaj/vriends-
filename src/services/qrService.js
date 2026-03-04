import api from './api';

export const trackQRScan = async () => {
  try {
    await api.post('/qr/track');
  } catch (error) {
    console.error('Erreur tracking QR scan:', error);
  }
};

export const getQRStats = async () => {
  const response = await api.get('/qr/stats');
  return response.data;
};
