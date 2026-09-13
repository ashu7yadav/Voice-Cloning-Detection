import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

export const api = {
  // Upload and analyze audio file
  analyzeAudio: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', 'upload');

    const response = await apiClient.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Direct microphone recording analysis
  analyzeRecording: async (audioBlob, filename = 'mic_recording.wav') => {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    const response = await apiClient.post('/recording/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Analyze preloaded demo sample by fetching and posting blob
  analyzeDemoSample: async (audioUrl, filename) => {
    const audioRes = await fetch(audioUrl);
    const blob = await audioRes.blob();
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('source', 'demo');

    const response = await apiClient.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get curated demo samples
  getDemoSamples: async () => {
    const response = await apiClient.get('/demo/samples');
    return response.data;
  },

  // Scan History
  getHistory: async (search = '', risk = '') => {
    const params = {};
    if (search) params.search = search;
    if (risk) params.risk = risk;
    const response = await apiClient.get('/history', { params });
    return response.data;
  },

  getHistoryById: async (id) => {
    const response = await apiClient.get(`/history/${id}`);
    return response.data;
  },

  deleteHistory: async (id) => {
    const response = await apiClient.delete(`/history/${id}`);
    return response.data;
  },

  // Live Security Dashboard Analytics
  getStats: async () => {
    const response = await apiClient.get('/stats');
    return response.data;
  },

  // Backend Health Check
  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default api;
