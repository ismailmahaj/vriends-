import api from './api';

export const submitContact = async (data) => {
  const response = await api.post('/contacts', data);
  return response.data;
};

export const getContacts = async (params = {}) => {
  const response = await api.get('/contacts', { params });
  return response.data;
};

export const markTreated = async (id, treated) => {
  const response = await api.patch(`/contacts/${id}/treated`, { treated });
  return response.data;
};

export const deleteContact = async (id) => {
  const response = await api.delete(`/contacts/${id}`);
  return response.data;
};

export const exportCSV = async () => {
  try {
    const response = await api.get('/contacts/export/csv', {
      responseType: 'blob'
    });
    
    // Vérifier si le blob contient des données
    if (response.data.size === 0) {
      console.warn('Le fichier CSV est vide');
      alert('Aucun contact à exporter');
      return;
    }
    
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'contacts-vriends.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ CSV exporté avec succès');
  } catch (error) {
    console.error('❌ Erreur export CSV:', error);
    alert('Erreur lors de l\'export CSV: ' + (error.response?.data?.error || error.message));
  }
};
