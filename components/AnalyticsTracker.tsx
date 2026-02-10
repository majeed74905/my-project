import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/analytics';

/**
 * AnalyticsTracker Component
 * Hooks into react-router-dom to track page changes automatically.
 * Must be placed inside a <BrowserRouter>.
 */
const AnalyticsTracker: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        // trackPageView is called only in production inside the service
        trackPageView(location.pathname + location.search);
    }, [location]);

    return null; // This component doesn't render anything
};

export default AnalyticsTracker;
