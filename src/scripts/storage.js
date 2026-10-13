export const KEYS = {
    autoplay: 'autoplayState',
    theme: 'theme',
};

export const DEFAULTS = {
    autoplay: 'enabled',
    theme: 'light',
};

export function storageGet(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
    });
}

export function storageSet(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set(data, resolve);
    });
}

export async function getAutoplayState() {
    const result = await storageGet([KEYS.autoplay]);
    return result[KEYS.autoplay] || DEFAULTS.autoplay;
}

export function setAutoplayState(value) {
    return storageSet({ [KEYS.autoplay]: value });
}

export async function getTheme() {
    const result = await storageGet([KEYS.theme]);
    const saved = result[KEYS.theme];
    return saved === 'light' || saved === 'dark' ? saved : DEFAULTS.theme;
}

export function setTheme(value) {
    return storageSet({ [KEYS.theme]: value });
}