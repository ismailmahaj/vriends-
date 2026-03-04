import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password, localStatus) => {
  const response = await api.post('/auth/register', { name, email, password, localStatus });
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const exportUsersCSV = async () => {
  try {
    const response = await api.get('/auth/export/csv', {
      responseType: 'blob'
    });
    
    if (response.data.size === 0) {
      console.warn('Le fichier CSV est vide');
      alert('Aucun utilisateur à exporter');
      return;
    }
    
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'utilisateurs-vriends.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ CSV utilisateurs exporté avec succès');
  } catch (error) {
    console.error('❌ Erreur export CSV utilisateurs:', error);
    alert('Erreur lors de l\'export CSV: ' + (error.response?.data?.error || error.message));
  }
};
