import api from './client';

export async function submitFeedback(body) {
  const { data } = await api.post('/api/feedback', body);
  return data;
}

export async function fetchFeedback() {
  const { data } = await api.get('/api/feedback');
  return data;
}
