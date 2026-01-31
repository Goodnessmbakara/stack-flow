/**
 * Analytics tracking service
 * Provides page view and event tracking for user behavior analysis
 */

import { logger } from './logger';

interface AnalyticsEvent {
    name: string;
    properties?: Record<string, unknown>;
}

class Analytics {
    private isEnabled = !import.meta.env.DEV; // Disable in development
    private queue: AnalyticsEvent[] = [];

    constructor() {
        // Initialize analytics service (e.g., PostHog, Mixpanel, Vercel Analytics)
        if (this.isEnabled) {
            this.initialize();
        }
    }

    private initialize() {
        // This would initialize your analytics provider
        // For now, we'll use console logging and prepare for future integration
        logger.info('Analytics initialized', { enabled: this.isEnabled });
    }

    /**
     * Track page view
     */
    trackPageView(path: string) {
        if (!this.isEnabled) return;

        this.track('page_view', {
            path,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Track custom event
     */
    track(eventName: string, properties?: Record<string, unknown>) {
        if (!this.isEnabled) {
            logger.debug('Analytics event (disabled)', { eventName, properties });
            return;
        }

        const event: AnalyticsEvent = {
            name: eventName,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
            },
        };

        this.queue.push(event);
        this.flush();
    }

    /**
     * Flush queued events
     */
    private flush() {
        if (this.queue.length === 0) return;

        // In production, this would send events to your analytics provider
        // For now, we'll just log them
        logger.debug('Analytics events', { count: this.queue.length, events: this.queue });

        // Clear the queue
        this.queue = [];
    }

    // Convenience methods for common events
    trackWalletConnect(address: string) {
        this.track('wallet_connect', { address });
    }

    trackWalletDisconnect() {
        this.track('wallet_disconnect');
    }

    trackPoolJoin(poolId: string, amount: number) {
        this.track('pool_join', { poolId, amount });
    }

    trackWhaleFollow(whaleId: string) {
        this.track('whale_follow', { whaleId });
    }

    trackStrategySelect(strategy: string) {
        this.track('strategy_select', { strategy });
    }

    trackTransaction(txId: string, type: string, amount?: number) {
        this.track('transaction_initiated', { txId, type, amount });
    }

    trackTransactionSuccess(txId: string) {
        this.track('transaction_success', { txId });
    }

    trackTransactionError(txId: string, error: string) {
        this.track('transaction_error', { txId, error });
    }

    trackSentimentView(sentiment: number) {
        this.track('sentiment_view', { sentiment });
    }

    // Performance tracking
    trackPerformance(metric: string, value: number, unit: string) {
        this.track('performance_metric', { metric, value, unit });
    }

    trackAPICall(endpoint: string, duration: number, success: boolean) {
        this.track('api_call', { endpoint, duration, success });
    }
}

export const analytics = new Analytics();
