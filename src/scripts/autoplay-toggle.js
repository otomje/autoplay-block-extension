import { getAutoplayState, setAutoplayState } from './storage.js';

async function init() {
    const button = document.querySelector('[data-autoplay-state]');
    if (!button) return;

    const currentState = await getAutoplayState();
    button.setAttribute('data-autoplay-state', currentState);

    button.addEventListener('click', async () => {
        const newState = button.getAttribute('data-autoplay-state') === 'enabled' ? 'disabled' : 'enabled';
        button.setAttribute('data-autoplay-state', newState);
        await setAutoplayState(newState);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}