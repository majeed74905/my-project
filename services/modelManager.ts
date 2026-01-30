/**
 * Model Manager - Handles automatic model switching based on rate limits
 */

export interface ModelConfig {
    name: string;
    displayName: string;
    rpm: number; // Requests per minute
    tpm: number; // Tokens per minute
    rpd: number; // Requests per day
    priority: number; // Lower = higher priority
}

export interface RateLimitTracker {
    modelName: string;
    requestCount: number;
    tokenCount: number;
    dailyRequestCount: number;
    lastMinuteReset: number;
    lastDayReset: number;
    isBlocked: boolean;
    blockUntil?: number;
}

// Available models in priority order
export const AVAILABLE_MODELS: ModelConfig[] = [
    {
        name: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        rpm: 5,
        tpm: 250000,
        rpd: 20,
        priority: 1
    },
    {
        name: 'gemini-2.5-flash-lite',
        displayName: 'Gemini 2.5 Flash Lite',
        rpm: 10,
        tpm: 250000,
        rpd: 20,
        priority: 2
    },
    {
        name: 'gemini-3-flash',
        displayName: 'Gemini 3 Flash',
        rpm: 5,
        tpm: 250000,
        rpd: 20,
        priority: 3
    },
    {
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash (Legacy)',
        rpm: 15,
        tpm: 1000000,
        rpd: 1500,
        priority: 4
    }
];

class ModelManager {
    private trackers: Map<string, RateLimitTracker> = new Map();
    private currentModelIndex: number = 0;
    private storageKey = 'zara_model_trackers';

    constructor() {
        this.loadTrackers();
        this.initializeTrackers();
    }

    private initializeTrackers() {
        AVAILABLE_MODELS.forEach(model => {
            if (!this.trackers.has(model.name)) {
                this.trackers.set(model.name, {
                    modelName: model.name,
                    requestCount: 0,
                    tokenCount: 0,
                    dailyRequestCount: 0,
                    lastMinuteReset: Date.now(),
                    lastDayReset: Date.now(),
                    isBlocked: false
                });
            }
        });
    }

    private loadTrackers() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.trackers = new Map(Object.entries(data));

                // Reset counters if time has passed
                this.trackers.forEach((tracker, key) => {
                    const now = Date.now();

                    // Reset minute counter if a minute has passed
                    if (now - tracker.lastMinuteReset > 60000) {
                        tracker.requestCount = 0;
                        tracker.tokenCount = 0;
                        tracker.lastMinuteReset = now;
                    }

                    // Reset daily counter if a day has passed
                    if (now - tracker.lastDayReset > 86400000) {
                        tracker.dailyRequestCount = 0;
                        tracker.lastDayReset = now;
                    }

                    // Unblock if block period has expired
                    if (tracker.isBlocked && tracker.blockUntil && now > tracker.blockUntil) {
                        tracker.isBlocked = false;
                        tracker.blockUntil = undefined;
                    }

                    this.trackers.set(key, tracker);
                });
            }
        } catch (error) {
            console.error('[ModelManager] Error loading trackers:', error);
        }
    }

    private saveTrackers() {
        try {
            const data = Object.fromEntries(this.trackers);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('[ModelManager] Error saving trackers:', error);
        }
    }

    /**
     * Get the best available model based on current rate limits
     */
    public getBestAvailableModel(): { model: ModelConfig; tracker: RateLimitTracker } | null {
        const now = Date.now();

        // Try each model in priority order
        for (const model of AVAILABLE_MODELS) {
            const tracker = this.trackers.get(model.name);
            if (!tracker) continue;

            // Skip if blocked
            if (tracker.isBlocked && tracker.blockUntil && now < tracker.blockUntil) {
                continue;
            }

            // Check if within rate limits
            const withinRPM = tracker.requestCount < model.rpm;
            const withinRPD = tracker.dailyRequestCount < model.rpd;

            if (withinRPM && withinRPD) {
                return { model, tracker };
            }
        }

        return null;
    }

    /**
     * Record a successful request
     */
    public recordRequest(modelName: string, estimatedTokens: number = 100) {
        const tracker = this.trackers.get(modelName);
        if (!tracker) return;

        const now = Date.now();

        // Reset counters if needed
        if (now - tracker.lastMinuteReset > 60000) {
            tracker.requestCount = 0;
            tracker.tokenCount = 0;
            tracker.lastMinuteReset = now;
        }

        if (now - tracker.lastDayReset > 86400000) {
            tracker.dailyRequestCount = 0;
            tracker.lastDayReset = now;
        }

        // Increment counters
        tracker.requestCount++;
        tracker.tokenCount += estimatedTokens;
        tracker.dailyRequestCount++;

        this.trackers.set(modelName, tracker);
        this.saveTrackers();
    }

    /**
     * Record a rate limit error
     */
    public recordRateLimitError(modelName: string, retryAfterSeconds: number = 60) {
        const tracker = this.trackers.get(modelName);
        if (!tracker) return;

        tracker.isBlocked = true;
        tracker.blockUntil = Date.now() + (retryAfterSeconds * 1000);

        this.trackers.set(modelName, tracker);
        this.saveTrackers();

        console.log(`[ModelManager] Model ${modelName} blocked until ${new Date(tracker.blockUntil).toLocaleTimeString()}`);
    }

    /**
     * Get current model status for all models
     */
    public getModelStatus(): Array<{ model: ModelConfig; tracker: RateLimitTracker; available: boolean }> {
        const now = Date.now();

        return AVAILABLE_MODELS.map(model => {
            const tracker = this.trackers.get(model.name);
            if (!tracker) {
                return { model, tracker: this.createDefaultTracker(model.name), available: false };
            }

            const isBlocked = tracker.isBlocked && tracker.blockUntil ? now < tracker.blockUntil : false;
            const withinRPM = tracker.requestCount < model.rpm;
            const withinRPD = tracker.dailyRequestCount < model.rpd;
            const available = !isBlocked && withinRPM && withinRPD;

            return { model, tracker, available };
        });
    }

    private createDefaultTracker(modelName: string): RateLimitTracker {
        return {
            modelName,
            requestCount: 0,
            tokenCount: 0,
            dailyRequestCount: 0,
            lastMinuteReset: Date.now(),
            lastDayReset: Date.now(),
            isBlocked: false
        };
    }

    /**
     * Reset all trackers (for testing)
     */
    public resetAll() {
        this.trackers.clear();
        localStorage.removeItem(this.storageKey);
        this.initializeTrackers();
    }
}

// Singleton instance
export const modelManager = new ModelManager();
