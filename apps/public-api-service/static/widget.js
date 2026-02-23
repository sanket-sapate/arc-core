(function () {
    // 1. Initialization & Context Extraction

    // Check if consent is already resolved
    if (localStorage.getItem('arc_consent_resolved') === 'true') {
        return; // Do nothing if already resolved
    }

    const currentScript = document.currentScript;
    if (!currentScript) {
        console.warn("ARC GRC Widget: Cannot find current script tag.");
        return;
    }

    const orgId = currentScript.getAttribute('data-org-id');
    if (!orgId) {
        console.warn("ARC GRC Widget: 'data-org-id' attribute is missing on the script tag.");
        return;
    }

    const domain = window.location.hostname;
    const apiUrl = currentScript.src ? new URL(currentScript.src).origin : 'http://localhost:9080';

    // Generate or retrieve visitor ID
    let visitorId = localStorage.getItem('arc_visitor_id');
    if (!visitorId) {
        visitorId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem('arc_visitor_id', visitorId);
    }

    // 2. Fetch Banner Configuration
    fetch(`${apiUrl}/v1/sdk/banner/${orgId}/${domain}`)
        .then(response => {
            if (response.status === 404) {
                console.warn("ARC GRC Widget: Banner configuration not found for this domain.");
                return null;
            }
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(config => {
            if (!config) return; // 404 or other silent exit
            renderBanner(config);
        })
        .catch(error => {
            console.error("ARC GRC Widget: Error fetching banner configuration.", error);
        });

    // 3. Render the UI
    function renderBanner(config) {
        const container = document.createElement('div');
        container.id = 'arc-grc-consent-container';
        document.body.appendChild(container);

        // Use Shadow DOM to isolate styles
        const shadow = container.attachShadow({ mode: 'open' });

        const title = config.title || 'Privacy Preference Center';
        const description = config.description || 'We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking accept, you agree to this, as outlined in our Cookie Policy.';

        shadow.innerHTML = `
            <style>
                :host {
                    all: initial; /* Reset all inherited styles */
                }
                .arc-banner {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    background: #ffffff;
                    border-top: 1px solid #e5e7eb;
                    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    z-index: 2147483647;
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    box-sizing: border-box;
                    color: #111827;
                }
                .arc-banner-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                @media (min-width: 768px) {
                    .arc-banner-content {
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                    }
                }
                .arc-text-container {
                    flex: 1;
                    padding-right: 2rem;
                }
                .arc-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                }
                .arc-description {
                    font-size: 0.875rem;
                    color: #4b5563;
                    margin: 0;
                    line-height: 1.5;
                }
                .arc-buttons {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .arc-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .arc-btn-primary {
                    background-color: #2563eb;
                    color: white;
                }
                .arc-btn-primary:hover {
                    background-color: #1d4ed8;
                }
                .arc-btn-secondary {
                    background-color: white;
                    color: #374151;
                    border-color: #d1d5db;
                }
                .arc-btn-secondary:hover {
                    background-color: #f3f4f6;
                }
                .arc-btn-outline {
                    background-color: transparent;
                    color: #4b5563;
                    text-decoration: underline;
                }
                .arc-btn-outline:hover {
                    color: #111827;
                }
            </style>
            <div class="arc-banner">
                <div class="arc-banner-content">
                    <div class="arc-text-container">
                        <h2 class="arc-title">${title}</h2>
                        <p class="arc-description">${description}</p>
                    </div>
                    <div class="arc-buttons">
                        <button id="arc-manage-btn" class="arc-btn arc-btn-outline">Manage Preferences</button>
                        <button id="arc-reject-btn" class="arc-btn arc-btn-secondary">Reject All</button>
                        <button id="arc-accept-btn" class="arc-btn arc-btn-primary">Accept All</button>
                    </div>
                </div>
            </div>
        `;

        // 4. Wire Consent Submission
        const acceptBtn = shadow.getElementById('arc-accept-btn');
        const rejectBtn = shadow.getElementById('arc-reject-btn');

        acceptBtn.addEventListener('click', () => submitConsent(true));
        rejectBtn.addEventListener('click', () => submitConsent(false));
    }

    function submitConsent(isAccepted) {
        // Build the basic consent payload based on "Accept All" or "Reject All"
        // In a real scenario with "Manage Preferences", this would map specific purposes
        const consentsPayload = {
            "analytics": isAccepted,
            "marketing": isAccepted,
            "functional": isAccepted,
            "strictly_necessary": true // Always true
        };

        const payload = {
            organization_id: orgId,
            domain: domain,
            anonymous_id: visitorId,
            consents: consentsPayload
            // IPAddress and UserAgent are derived server-side if not explicitly sent
        };

        fetch(`${apiUrl}/v1/sdk/consent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (response.status === 202) {
                    // Success: Hide banner and save flag
                    const container = document.getElementById('arc-grc-consent-container');
                    if (container) {
                        container.remove();
                    }
                    localStorage.setItem('arc_consent_resolved', 'true');
                } else {
                    console.error("ARC GRC Widget: Failed to record consent. Status:", response.status);
                }
            })
            .catch(error => {
                console.error("ARC GRC Widget: Network error while submitting consent.", error);
            });
    }

})();
