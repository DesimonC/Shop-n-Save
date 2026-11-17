import { supabaseUrl, supabasePublishableKey } from './config.js';
const status = document.querySelector('#status');
const button = document.querySelector('#check');
async function checkConnection() {
  button.disabled = true;
  status.textContent = 'Checking connection…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(supabaseUrl + '/auth/v1/settings', {
      headers: { apikey: supabasePublishableKey },
      signal: controller.signal
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const settings = await response.json();
    if (!settings || typeof settings.external !== 'object') throw new Error('Unexpected response');
    status.textContent = 'Supabase service connected. The shopping app is still being built.';
  } catch (error) {
    status.textContent = 'Connection not confirmed. The service may still be starting. Please try again shortly.';
    console.warn('Supabase connection check:', error.message);
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
  }
}
button.addEventListener('click', checkConnection);
checkConnection();
