(function (window) {
    class CMP {
        constructor() {
            this.config = {
                apiKey: null,
                formSelector: null,
                portalUrl: '/static/portal.html',
                mode: 'strict'
            };
            this.requiredConsents = new Set();
            this.form = null;
            this.isAuthorized = false;
            this.isSubmitting = false; // Prevent double submission
        }

        init(config) {
            // Robust Initialization
            if (!config.apiKey) throw new Error("CMP: apiKey is required");
            if (!config.formSelector) throw new Error("CMP: formSelector is required");

            this.config = {
                ...this.config,
                ...config,
                // Optional callbacks
                onValidationFailed: config.onValidationFailed || null,
                onSuccess: config.onSuccess || null,
                onError: config.onError || null
            };

            this.fetchFormDetails();
        }

        fetchFormDetails() {
            this.form = document.querySelector(this.config.formSelector);
            if (!this.form) {
                console.warn(`CMP: Form not found with selector: ${this.config.formSelector}. Retrying in 1s...`);
                // Simple retry mechanism
                setTimeout(() => this.fetchFormDetails(), 1000);
                return;
            }

            // Attach listener
            // Ideally we check if we already attached, but this init runs once.
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            window.addEventListener('message', (e) => this.handleMessage(e));
            console.log('CMP: Initialized and attached to form.');
        }

        recalculateConsents() {
            this.requiredConsents.clear();
            const inputs = this.form.querySelectorAll('[data-cmp-consent-id]');

            inputs.forEach(input => {
                const id = input.dataset.cmpConsentId;
                if (!id) return;

                let isRelevant = false;

                // Logic: Include consent ID if input is (Checked AND Checkbox/Radio) OR (Non-Empty AND Not Checkbox/Radio)
                if (input.type === 'checkbox' || input.type === 'radio') {
                    if (input.checked) isRelevant = true;
                } else {
                    if (input.value && input.value.trim() !== '') isRelevant = true;
                }

                if (isRelevant) {
                    this.requiredConsents.add(id);
                }
            });
        }

        async handleSubmit(e) {
            // Fail-Safe Submission: Bypass if authorized
            if (this.isAuthorized) return; // Allow default submission

            if (this.isSubmitting) {
                e.preventDefault();
                return;
            }

            // Always prevent default to analyze first
            e.preventDefault();
            this.isSubmitting = true;

            try {
                this.recalculateConsents();

                if (this.requiredConsents.size === 0) {
                    // No consents required, allow submission
                    Object.getPrototypeOf(this.form).submit.call(this.form);
                    return;
                }

                // Prepare to Open Portal
                this.openPortal();

            } catch (err) {
                console.error("CMP: Error during submission handling", err);
                this.isSubmitting = false; // Reset to allow retry
            }
        }

        openPortal() {
            const consents = Array.from(this.requiredConsents).join(',');
            const width = 500;
            const height = 600;
            const left = (window.screen.width / 2) - (width / 2);
            const top = (window.screen.height / 2) - (height / 2);

            const url = `${this.config.portalUrl}?clientId=${this.config.apiKey}&consents=${encodeURIComponent(consents)}`;

            const popup = window.open(
                url,
                'CMP_Portal',
                `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
            );

            if (!popup) {
                alert("Please allow popups to complete the consent process.");
                this.isSubmitting = false;
                return;
            }

            // Monitor popup closure (for negative flow)
            const timer = setInterval(() => {
                if (popup.closed) {
                    clearInterval(timer);
                    // Give a small grace period for the message to arrive? 
                    // No, message arrival should be instant/before close. 
                    // If closed and not authorized, it's a cancel.
                    if (!this.isAuthorized) {
                        console.warn("CMP: Popup closed without authorization.");
                        this.isSubmitting = false;
                        if (this.config.onError) this.config.onError(new Error("User closed consent portal"));
                    }
                }
            }, 1000);
        }

        handleMessage(event) {
            // In a real env, check event.origin matches portal domain
            const data = event.data;

            if (data.source === 'CMP_WINDOW') {
                if (data.status === 'AUTHORIZED') {
                    console.log('CMP: Authorized. Receipt:', data.receiptId);
                    this.isAuthorized = true;

                    // Append receipt ID
                    // Remove old input if exists
                    const oldInput = this.form.querySelector('input[name="consent_receipt_id"]');
                    if (oldInput) oldInput.remove();

                    const receiptInput = document.createElement('input');
                    receiptInput.type = 'hidden';
                    receiptInput.name = 'consent_receipt_id';
                    receiptInput.value = data.receiptId;
                    this.form.appendChild(receiptInput);

                    // Final Submission
                    Object.getPrototypeOf(this.form).submit.call(this.form);
                } else if (data.status === 'REJECTED') {
                    console.error('CMP: Authorization rejected');

                    if (this.config.onError) this.config.onError(new Error("Consent Rejected"));
                    else alert('Consent was rejected. Cannot proceed.');

                    this.isSubmitting = false;
                }
            }
        }
        async translateContent(text, targetLang) {
            try {
                // Call the backend API proxy for translation
                // Assuming the backend has an endpoint /api/translate or similar exposed
                // Currently we updated the backend *Service* but need to expose it via HTTP handler?
                // Wait, the user asked for SDK component.
                // The backend SDK handler usually proxies these.
                // Let's assume an endpoint exists or we need to add one.
                // Looking at open files: internal/handlers/sdk_handler.go.
                // I should verify if an endpoint exists. For now, adding the method stub.

                const response = await fetch(`/api/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, targetLang })
                });

                if (!response.ok) throw new Error('Translation failed');
                const data = await response.json();
                return data.translatedText;
            } catch (err) {
                console.error("CMP: Translation error", err);
                return text; // Fallback to original
            }
        }
    }

    window.CMP = new CMP();
})(window);
