import { getTheme, setTheme } from './storage.js';

const root = document.documentElement;

getTheme().then((theme) => {
    root.setAttribute('data-theme', theme);

    const themeButton = document.querySelector('[data-theme-state]');
    if (!themeButton) return;

    themeButton.setAttribute('data-theme-state', theme);

    themeButton.addEventListener('click', async () => {
        const newTheme = themeButton.getAttribute('data-theme-state') === 'light' ? 'dark' : 'light';
        themeButton.setAttribute('data-theme-state', newTheme);
        root.setAttribute('data-theme', newTheme);
        await setTheme(newTheme);
    });
});