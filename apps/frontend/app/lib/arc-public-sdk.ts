/**
 * ARC Public API SDK
 * Integrates with the ARC Public API service for consent management
 */

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  strictly_necessary: boolean;
  advertising?: boolean;
  personalization?: boolean;
}

export interface ConsentPayload {
  organization_id: string;
  domain: string;
  anonymous_id: string;
  consents: ConsentChoice;
}

export class ArcPublicAPI {
  private apiUrl: string;
  private orgId: string;
  private domain: string;

  constructor(config: { apiUrl: string; orgId: string; domain: string }) {
    this.apiUrl = config.apiUrl;
    this.orgId = config.orgId;
    this.domain = config.domain;
  }

  /**
   * Generate a unique anonymous ID for the user
   */
  private generateAnonymousId(): string {
    // Check if we already have an ID in localStorage
    const existingId = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('arc_anonymous_id') 
      : null;
    
    if (existingId) return existingId;

    // Generate new ID
    const newId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('arc_anonymous_id', newId);
    }
    
    return newId;
  }

  /**
   * Fetch banner configuration from Public API
   */
  async getBannerConfig(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/sdk/banner/${this.orgId}/${this.domain}`);
      
      if (response.status === 404) {
        return null; // No banner configured
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch banner: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('ARC Public API: Error fetching banner config:', error);
      return null;
    }
  }

  /**
   * Submit consent to Public API
   */
  async submitConsent(consents: ConsentChoice): Promise<boolean> {
    try {
      const payload: ConsentPayload = {
        organization_id: this.orgId,
        domain: this.domain,
        anonymous_id: this.generateAnonymousId(),
        consents
      };

      const response = await fetch(`${this.apiUrl}/v1/sdk/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 202) {
        // Store consent locally
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('arc_consent_given', 'true');
          localStorage.setItem('arc_consent_data', JSON.stringify(consents));
          localStorage.setItem('arc_consent_timestamp', Date.now().toString());
        }
        return true;
      }
      
      throw new Error(`Consent submission failed: ${response.status}`);
    } catch (error) {
      console.error('ARC Public API: Error submitting consent:', error);
      return false;
    }
  }

  /**
   * Check if user has already given consent
   */
  hasUserConsented(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('arc_consent_given') === 'true';
  }

  /**
   * Get stored consent data
   */
  getStoredConsent(): ConsentChoice | null {
    if (typeof localStorage === 'undefined') return null;
    const consentData = localStorage.getItem('arc_consent_data');
    return consentData ? JSON.parse(consentData) : null;
  }

  /**
   * Clear all consent data (for testing or withdrawal)
   */
  clearConsent(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('arc_consent_given');
    localStorage.removeItem('arc_consent_data');
    localStorage.removeItem('arc_consent_timestamp');
    localStorage.removeItem('arc_anonymous_id');
  }

  /**
   * Load the widget script dynamically
   */
  loadWidget(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if widget is already loaded
      if (window.ARC_GRC_WIDGET) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `${this.apiUrl}/v1/sdk/widget.js`;
      script.async = true;
      
      script.onload = () => {
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load ARC widget script'));
      };
      
      document.head.appendChild(script);
    });
  }
}

// Extend window interface for widget
declare global {
  interface Window {
    ARC_GRC_WIDGET?: any;
  }
}
