import { AUTH_MESSAGE } from './platform-constants.js';

// Runs only on https://wiro.ai/extension/callback, the page wiro.ai sends the
// browser to after sign-in. It hands the address (with the one-time code) to
// the background, which finishes the sign-in and closes this tab. On failure it
// says so on the page.

interface Answer {
  ok: boolean;
  error?: string;
}

void browser.runtime.sendMessage({ type: AUTH_MESSAGE, url: location.href }).then((answer: Answer | undefined) => {
  if (answer?.ok) return;
  const note = document.createElement('p');
  note.textContent = `Wiro for Safari could not finish signing in: ${answer?.error ?? 'no answer from the extension'}. Close this tab and start again from the Wiro panel.`;
  note.style.cssText = 'font: 15px/1.5 -apple-system, sans-serif; max-width: 34em; margin: 48px auto; padding: 0 16px;';
  document.body.prepend(note);
});
