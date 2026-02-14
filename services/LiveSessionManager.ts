
import { GoogleGenAI, LiveServerMessage } from "@google/genai";

interface LiveSessionCallbacks {
    onMessage: (msg: LiveServerMessage) => void;
    onError: (err: any) => void;
    onClose: (e: CloseEvent) => void;
    onOpen: () => void;
}

export class LiveSessionManager {
    private session: any = null;
    private isActive = false;
    private callbacks: LiveSessionCallbacks;
    private apiKey: string;
    private model: string;
    private config: any;

    constructor(
        apiKey: string,
        model: string,
        config: any,
        callbacks: LiveSessionCallbacks
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.config = config;
        this.callbacks = callbacks;
    }

    public async connect() {
        if (this.isActive) return;

        try {
            this.isActive = true;
            const ai = new GoogleGenAI({ apiKey: this.apiKey });

            // We pass callbacks directly to connect as per SDK usage
            const session = await ai.live.connect({
                model: this.model,
                config: this.config,
                callbacks: {
                    onopen: () => {
                        if (this.isActive) this.callbacks.onOpen();
                    },
                    onmessage: (msg: LiveServerMessage) => {
                        if (this.isActive) this.callbacks.onMessage(msg);
                    },
                    onclose: (e: CloseEvent) => {
                        if (this.isActive) {
                            this.isActive = false;
                            this.callbacks.onClose(e);
                        }
                    },
                    onerror: (e: any) => {
                        if (this.isActive) this.callbacks.onError(e);
                    }
                }
            });

            if (!this.isActive) {
                // Was cancelled
                try { session.close(); } catch (e) { }
                return;
            }

            this.session = session;

        } catch (e: any) {
            this.isActive = false;
            this.callbacks.onError(e);
        }
    }

    // Removed old connectWithCallbacks as we standardized on connect() above


    public sendRealtimeInput(data: { media: { mimeType: string; data: string } }) {
        if (!this.isActive || !this.session) return;
        try {
            this.session.sendRealtimeInput(data);
        } catch (e: any) {
            if (!e.message?.includes("CLOSING or CLOSED")) {
                console.error("LiveSession Send Error:", e);
            }
        }
    }

    public sendToolResponse(response: any) {
        if (!this.isActive || !this.session) return;
        try {
            this.session.sendToolResponse(response);
        } catch (e: any) {
            if (!e.message?.includes("CLOSING or CLOSED")) {
                console.error("LiveSession ToolRes Error:", e);
            }
        }
    }

    public disconnect() {
        this.isActive = false;
        if (this.session) {
            try {
                this.session.close();
            } catch (e) { }
            this.session = null;
        }
    }

    public get isConnected(): boolean {
        return this.isActive && this.session !== null;
    }
}
