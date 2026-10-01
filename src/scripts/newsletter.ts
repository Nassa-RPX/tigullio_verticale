import { subscribe, validateSignup } from '@/lib/newsletter';

document.querySelectorAll<HTMLFormElement>('[data-newsletter]').forEach(form => {
  const widget = form.closest<HTMLElement>('[data-newsletter-widget]')!;
  const email = form.elements.namedItem('email') as HTMLInputElement;
  const name = form.elements.namedItem('name') as HTMLInputElement | null;
  const consent = form.elements.namedItem('consent') as HTMLInputElement | null;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const full = form.dataset.newsletter === 'full';
  const mode = import.meta.env.PUBLIC_KIT_SUBMIT_MODE === 'live' ? 'live' : 'mock';
  let pending = false;
  const showError = (input: HTMLInputElement | null, message: string) => {
    if (!input) return;
    input.toggleAttribute('aria-invalid', !!message);
    if (message) input.setAttribute('aria-invalid', 'true');
    const field = input.closest('.field'); field?.classList.toggle('is-invalid', !!message);
    const error = field?.querySelector('.field__error'); if (error) error.textContent = message;
  };
  const validate = () => {
    const errors = validateSignup({ email: email.value, name: name?.value }, full, !!consent?.checked);
    showError(email, errors.email); showError(name, errors.name); showError(consent, errors.consent);
    return errors;
  };
  email.addEventListener('blur', () => { if (email.value) validate(); });
  for (const input of [email, name, consent]) input?.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) validate(); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (pending) return;
    const errors = validate();
    status.textContent = ''; status.className = 'form-status';
    if (errors.email || errors.name || errors.consent) {
      status.textContent = errors.consent; status.className = 'form-status form-status--err is-visible';
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return;
    }
    const label = button.textContent;
    pending = true; button.disabled = true; button.textContent = 'Invio…'; form.setAttribute('aria-busy', 'true');
    try {
      const result = await subscribe({ email: email.value, name: name?.value }, { mode, key: import.meta.env.PUBLIC_KIT_API, mockScenario: mode === 'mock' ? new URL(location.href).searchParams.get('newsletter-test') ?? undefined : undefined });
      const success = widget.querySelector<HTMLElement>('[data-form-success]')!;
      if (result.mocked) {
        success.querySelector('h2')!.textContent = 'Prova completata';
        success.querySelector('p')!.textContent = 'Il modulo funziona. Questa è una prova: nessuna iscrizione è stata inviata.';
      }
      form.hidden = true; success.hidden = false; success.classList.add('is-visible'); success.focus();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Non è stato possibile inviare il modulo. Riprova.';
      status.className = 'form-status form-status--err is-visible';
    } finally { pending = false; button.disabled = false; button.textContent = label; form.removeAttribute('aria-busy'); }
  });
});
