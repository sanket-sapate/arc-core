/**
 * Cookie Consent SDK - Core
 * Decoupled Architecture: Core Logic + Pluggable UI
 */
(function () {
    'use strict';

    class CMPCore {
        constructor() {
            this.config = {
                apiKey: null,
                apiUrl: null,
                domain: window.location.hostname,
                uiUrl: '/assets/cmp-ui.js',
                cssUrl: '/assets/cmp-ui.css',
                autoMount: true,
                containerId: 'cmp-root'
            };

            this.state = {
                consent: null,
                history: null,
                isBannerVisible: false,
                isSettingsOpen: false
            };

            this.listeners = {};
            this.uiMounted = false;
        }

        /**
         * Initialize the SDK
         */
        async init(options) {
            this.config = { ...this.config, ...options };

            if (!this.config.apiKey) {
                console.error('CMP: API Key is required');
                return;
            }
            this.config.apiUrl = this.config.apiUrl || window.location.origin;

            // 1. Fetch Config (Banner + Rules)
            await this.fetchConfig();

            // 2. Initialize Script Blocker (Robustness)
            this.scriptBlocker = new ScriptBlocker(this.state.rules, this.state.consent);
            this.scriptBlocker.init();

            // 3. Identity & State Loading
            this.loadLocalConsent();

            // 4. Mount UI
            if (this.config.autoMount && this.state.bannerConfig) {
                await this.loadUIAssets();
                this.mountUI();
            }

            this.trigger('initialized', this.state);
        }

        async fetchConfig() {
            try {
                const res = await fetch(`${this.config.apiUrl}/api/v1/public/cookie-banner?domain=${encodeURIComponent(this.config.domain)}`, {
                    headers: { 'X-API-Key': this.config.apiKey }
                });
                if (res.ok) {
                    const data = await res.json();
                    this.state.bannerConfig = data.banner;
                    this.state.categories = data.categories; // Available categories
                    this.state.rules = data.rules;

                    // Update Config with remote settings if needed
                    if (data.banner && data.banner.style) {
                        this.config.cssUrl = data.banner.style.cssUrl || this.config.cssUrl;
                    }
                }
            } catch (err) {
                console.warn('CMP: Failed to fetch config', err);
            }
        }

        /**
         * Identity Management
         */
        getAnonymousId() {
            let uid = localStorage.getItem('cookie_consent_uid');
            if (!uid) {
                uid = crypto.randomUUID ? crypto.randomUUID() : 'user_' + Math.random().toString(36).substr(2, 9) + Date.now();
                localStorage.setItem('cookie_consent_uid', uid);
            }
            return uid;
        }

        loadLocalConsent() {
            const stored = localStorage.getItem('cookie_consent');
            if (stored) {
                try {
                    this.state.consent = JSON.parse(stored);
                    // Update blocker with current consent
                    if (this.scriptBlocker) this.scriptBlocker.updateConsent(this.state.consent);
                } catch (e) {
                    console.error('CMP: Failed to parse local consent', e);
                }
            } else {
                // If no consent, show banner
                this.state.isBannerVisible = true;
            }
        }

        async fetchHistory() {
            // ... existing history fetch ...
        }

        /**
         * UI Loading & Mounting
         */
        async loadUIAssets() {
            if (window.CMPUI) return;

            // Use banner config styles if available
            // ... matching implementation ...

            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.config.cssUrl;
            document.head.appendChild(link);

            // Load JS
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = this.config.uiUrl;
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        }

        mountUI() {
            if (!window.CMPUI || !window.CMPUI.mount) return;

            // Use container or create
            let container = document.getElementById(this.config.containerId);
            if (!container) {
                container = document.createElement('div');
                container.id = this.config.containerId;
                document.body.appendChild(container);
            }

            const props = {
                config: {
                    ...this.config,
                    banner: this.state.bannerConfig, // Pass full banner object
                    categories: this.state.categories,
                    openBanner: this.state.isBannerVisible
                },
                initialPreferences: this.state.consent ? this.state.consent.categories : undefined,
                onUpdate: this.handleUIUpdate.bind(this)
            };

            window.CMPUI.mount(container, props, this.config.cssUrl);
            this.uiMounted = true;
        }

        /**
         * Core Actions
         */
        handleUIUpdate(preferences) {
            const consent = {
                userId: this.getAnonymousId(),
                bannerId: this.state.bannerConfig?.id,
                categories: preferences,
                acceptedAll: Object.values(preferences).every(v => v === true),
                rejectedAll: Object.values(preferences).every(v => v === false),
                timestamp: new Date().toISOString()
            };

            this.saveConsent(consent);
        }

        async saveConsent(consent) {
            this.state.consent = consent;
            this.state.isBannerVisible = false;
            localStorage.setItem('cookie_consent', JSON.stringify(consent));

            // Update Blocker immediately
            if (this.scriptBlocker) this.scriptBlocker.updateConsent(consent);

            // Server Save
            try {
                await fetch(`${this.config.apiUrl}/api/v1/public/cookie-consent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.config.apiKey
                    },
                    body: JSON.stringify(consent)
                });
            } catch (error) {
                console.error('CMP: Failed to save consent', error);
            }

            this.trigger('consentUpdated', consent);
        }

        // ... event methods ...
        on(event, callback) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(callback);
        }

        trigger(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(cb => cb(data));
            }
        }
    }

    /**
     * Script Blocker Implementation
     * Uses MutationObserver to intercept script tags
     */
    class ScriptBlocker {
        constructor(rules, consent) {
            this.rules = rules || [];
            this.consent = consent || null;
            this.observer = null;
        }

        init() {
            // Start observing immediately
            this.observer = new MutationObserver(this.handleMutations.bind(this));
            this.observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            // Also handle beforescriptexecute for older browsers/FF
            this.handleBeforeScriptExecute = this.handleBeforeScriptExecute.bind(this);
            window.addEventListener('beforescriptexecute', this.handleBeforeScriptExecute, true);
        }

        updateConsent(consent) {
            this.consent = consent;
            this.unblockAllowed();
        }

        handleMutations(mutations) {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT') {
                        this.checkScript(node);
                    }
                });
            });
        }

        handleBeforeScriptExecute(e) {
            if (this.shouldBlock(e.target)) {
                e.preventDefault();
                e.stopPropagation();
            }
        }

        checkScript(scriptNode) {
            const src = scriptNode.src;
            if (!src && !scriptNode.innerText) return; // Ignore empty

            if (this.shouldBlock(scriptNode)) {
                // Prevent execution by changing type
                scriptNode.type = 'text/plain';
                scriptNode.dataset.cmpBlocked = 'true';
                scriptNode.dataset.cmpOriginalType = scriptNode.type;

                // Chrome/Safari: If already inserted, it might be too late for Observer if async.
                // But for dynamically added scripts via JS, this works often.
                // For initial HTML, we need this SDK to be in <head> top.
                console.warn('CMP: Blocked script', src || 'inline');
            }
        }

        shouldBlock(scriptNode) {
            // 1. If no consent decision yet: Block everything (Strict Mode)
            if (!this.consent) return true;

            const src = scriptNode.src;
            if (!src) return false; // Inline scripts - harder to pattern match, assume allowed or handle differently

            // 2. Check against Rules
            for (const rule of this.rules) {
                if (!rule.active && !rule.enabled) continue; // Handle both 'active' (DB) and 'enabled' (API) conventions

                // Simple inclusion match for now. Could be Regex later.
                if (src.includes(rule.url_pattern || rule.url)) {
                    // Found a rule for this script.
                    // Check if the associated Category (Purpose) is consented.

                    const categoryId = rule.purpose_id || rule.categoryId;

                    // Consent object structure: { categories: { "purpose_id": true/false }, ... }
                    if (this.consent.categories && this.consent.categories[categoryId]) {
                        return false; // ALLOW: User consented to this category
                    } else {
                        console.warn(`CMP: Blocking script ${src} (Category ${categoryId} denied)`);
                        return true; // BLOCK: User denied this category
                    }
                }
            }

            // 3. Default Behavior for Unknown Scripts
            // Strict: Block if unknown? Or Allow?
            // Usually, if not classified, allow (fail-open) to avoid breaking site, 
            // OR strict (fail-closed) requires classifying everything.
            // Let's go with Fail-Open for "Industry Standard" usability, 
            // but log it so admin knows to classify it.
            return false;
        }

        unblockAllowed() {
            // Scan for blocked scripts and unblock if now allowed
            const blocked = document.querySelectorAll('script[type="text/plain"][data-cmp-blocked="true"]');
            blocked.forEach(script => {
                if (!this.shouldBlock(script)) {
                    // Unblock
                    const newScript = document.createElement('script');
                    newScript.text = script.innerText;
                    if (script.src) newScript.src = script.src;
                    newScript.async = script.async;

                    script.parentNode.replaceChild(newScript, script);
                }
            });
        }
    }

    // Expose Global
    window.CC = new CMPCore();
    window.CookieConsentSDK = window.CC;

})();
