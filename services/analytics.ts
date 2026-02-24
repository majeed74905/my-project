/**
 * Enterprise Analytics Service
 * Handles Google Analytics (GA4) and Microsoft Clarity integrations.
 * Supported features: Page views, custom events, and user identification.
 */

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
        clarity: (...args: any[]) => void;
    }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const GA_STREAM_ID = import.meta.env.VITE_GA_STREAM_ID;
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

const isProd = import.meta.env.PROD;

/**
 * Initialize analytics scripts if they aren't already in the DOM.
 * This is a fallback for dynamic injection, though <head> injection is preferred for production.
 */
export const initAnalytics = () => {
    if (!isProd) {
        console.info('[Analytics] Analytics disabled in development mode.');
        return;
    }

    if (!GA_MEASUREMENT_ID || !CLARITY_PROJECT_ID) {
        console.warn('[Analytics] Missing Measurement ID or Project ID.');
        return;
    }

    // GA4 Initialization (already handled in index.html, but keeping logic consistent)
    if (typeof window !== 'undefined' && !window.gtag) {
        console.warn('[Analytics] GA4 script not detected in <head>. Please ensure it is injected correctly.');
    }

    // Clarity Initialization (already handled in index.html)
    if (typeof window !== 'undefined' && !window.clarity) {
        console.warn('[Analytics] Microsoft Clarity script not detected in <head>.');
    }
};

/**
 * Track a page view
 */
export const trackPageView = (path: string, title?: string) => {
    if (!isProd || !window.gtag) return;

    window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: path,
        page_title: title || document.title,
    });
};

/**
 * Track a custom event
 * @param eventName Name of the event (e.g., 'login', 'file_upload')
 * @param params Additional metadata (e.g., { method: 'google', status: 'success' })
 */
export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
    if (!isProd) {
        console.log(`[Analytics Event] ${eventName}`, params);
        return;
    }

    // Track in GA4
    if (window.gtag) {
        window.gtag('event', eventName, params);
    }

    // Track in Clarity (as custom tags if needed)
    if (window.clarity) {
        window.clarity('set', eventName, JSON.stringify(params));
    }
};

/**
 * Identify user across platforms
 * @param userId Unique identifier (anonymized)
 * @param traits Additional user properties
 */
export const identifyUser = (userId: string, traits: Record<string, any> = {}) => {
    if (!isProd) return;

    // Identify in GA4
    if (window.gtag) {
        window.gtag('config', GA_MEASUREMENT_ID, {
            user_id: userId,
            ...traits,
        });
    }

    // Identify in Clarity
    if (window.clarity) {
        window.clarity('identify', userId);
        Object.entries(traits).forEach(([key, value]) => {
            window.clarity('set', key, String(value));
        });
    }
};
