export interface Signup { email: string; name?: string }
export interface NewsletterOptions { mode: 'live' | 'mock'; key?: string; fetcher?: typeof fetch; timeoutMs?: number; mockScenario?: string }
export function validateSignup(data: Signup, full: boolean, consent: boolean) {
  return {
    email: !data.email.trim() ? 'Inserisci il tuo indirizzo email.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) ? 'Controlla l’indirizzo email: sembra incompleto.' : '',
    name: full && (data.name?.trim().length ?? 0) < 2 ? 'Inserisci il tuo nome (almeno 2 caratteri).' : '',
    consent: full && !consent ? 'Per procedere, accetta di ricevere la newsletter.' : '',
  };
}
export async function subscribe(data: Signup, options: NewsletterOptions) {
  if (options.mode === 'mock') {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (options.mockScenario === 'network') throw new Error('Connessione non disponibile. Riprova tra poco.');
    if (options.mockScenario === 'error') throw new Error('Il servizio non è disponibile. Riprova tra poco.');
    return { mocked: true };
  }
  if (!options.key) throw new Error('Il servizio non è disponibile. Riprova tra poco.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
  try {
    const response = await (options.fetcher ?? fetch)('https://api.kit.com/v4/subscribers', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': options.key },
      body: JSON.stringify({ email_address: data.email.trim(), ...(data.name?.trim() ? { first_name: data.name.trim() } : {}) }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(response.status === 422 ? 'Controlla i dati inseriti e riprova.' : 'Il servizio non è disponibile. Riprova tra poco.');
    return { mocked: false };
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('Controlla') || error.message.startsWith('Il servizio'))) throw error;
    throw new Error('Connessione non disponibile. Riprova tra poco.');
  } finally { clearTimeout(timer); }
}
