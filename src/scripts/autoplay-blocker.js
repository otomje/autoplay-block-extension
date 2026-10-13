'use strict';

const STORAGE_KEY = 'autoplayState';
const DEFAULT_STATE = 'enabled';
const GESTURE_WINDOW_MS = 2500;
const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'mousedown'];

let blockingActive = true;
let lastGestureTime = 0;
let mutationObserver = null;
let pendingScan = false;

const queuedNodes = [];
const hookedElements = new WeakSet();
const attributeObservers = new WeakMap();

function markGesture() {
    lastGestureTime = Date.now();
}
GESTURE_EVENTS.forEach((evt) => {
    document.addEventListener(evt, markGesture, { capture: true, passive: true });
});

function hasRecentGesture() {
    return Date.now() - lastGestureTime < GESTURE_WINDOW_MS;
}

const originalPlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function (...args) {
    if (!blockingActive || this.tagName !== 'VIDEO' || hasRecentGesture()) {
        return originalPlay.apply(this, args);
    }
    return Promise.reject(
        new DOMException('Autoplay blocked by extension', 'NotAllowedError')
    );
};

function stopAutoplayAttribute(video) {
    if (video.hasAttribute('autoplay')) {
        video.removeAttribute('autoplay');
    }
}

function enforceVideo(video) {
    if (hookedElements.has(video)) return;
    hookedElements.add(video);

    stopAutoplayAttribute(video);

    video.addEventListener('play', () => {
        if (blockingActive && !hasRecentGesture()) video.pause();
    });

    const attrObserver = new MutationObserver(() => {
        if (blockingActive) stopAutoplayAttribute(video);
    });
    attrObserver.observe(video, { attributes: true, attributeFilter: ['autoplay'] });
    attributeObservers.set(video, attrObserver);

    if (blockingActive && !video.paused && !hasRecentGesture()) {
        video.pause();
    }
}

function releaseVideo(video) {
    const observer = attributeObservers.get(video);
    if (observer) {
        observer.disconnect();
        attributeObservers.delete(video);
    }
}

function scanRoot(root) {
    if (!root) return;
    try {
        if (root.tagName === 'VIDEO') enforceVideo(root);

        if (typeof root.querySelectorAll === 'function') {
            root.querySelectorAll('video').forEach(enforceVideo);
            root.querySelectorAll('*').forEach((el) => {
                if (el.shadowRoot) scanRoot(el.shadowRoot);
            });
        }

        if (root.shadowRoot) scanRoot(root.shadowRoot);
    } catch (err) { }
}

function scheduleScan(node) {
    queuedNodes.push(node);
    if (pendingScan) return;
    pendingScan = true;
    requestAnimationFrame(() => {
        const nodes = queuedNodes.splice(0, queuedNodes.length);
        pendingScan = false;
        nodes.forEach(scanRoot);
    });
}

function applyBlocking(enable) {
    blockingActive = enable;

    if (enable) {
        scanRoot(document);
        if (!mutationObserver) {
            mutationObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) scheduleScan(node);
                    });
                }
            });
            mutationObserver.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        }
    } else {
        if (mutationObserver) {
            mutationObserver.disconnect();
            mutationObserver = null;
        }
        document.querySelectorAll('video').forEach(releaseVideo);
        queuedNodes.splice(0, queuedNodes.length);
    }
}

chrome.storage.local.get([STORAGE_KEY], (result) => {
    const state = result[STORAGE_KEY] || DEFAULT_STATE;
    applyBlocking(state === 'enabled');
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) {
        const newState = changes[STORAGE_KEY].newValue || DEFAULT_STATE;
        applyBlocking(newState === 'enabled');
    }
});