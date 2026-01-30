
export { };

declare global {
    interface Window {
        aistudio?: {
            openSelectKey: () => Promise<void>;
        };
    }
}
