// The app's setup window. ViewController.swift calls show() with the
// extension's state, and again every few seconds while the window is open, so
// the window changes as soon as the extension is turned on in Safari.

function show(enabled, useSettingsInsteadOfPreferences) {
    if (useSettingsInsteadOfPreferences === false) {
        // Safari before macOS 13 calls its settings Preferences.
        for (const word of document.querySelectorAll('.settings')) word.textContent = 'Preferences';
    }
    document.body.dataset.state = enabled === true ? 'on' : enabled === false ? 'off' : 'unknown';
}

function post(message) {
    webkit.messageHandlers.controller.postMessage(message);
}

for (const button of document.querySelectorAll('button.open-preferences')) {
    button.addEventListener('click', () => post('open-preferences'));
}
document.querySelector('button.open-safari').addEventListener('click', () => post('open-safari'));

setInterval(() => post('refresh-state'), 2000);
