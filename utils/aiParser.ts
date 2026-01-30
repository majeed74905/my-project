
/**
 * Parses AI response text to extract file updates.
 * Expected format:
 * ```tsx
 * // filename.tsx
 * code...
 * ```
 * or just
 * // filename.tsx
 * code...
 */
export const parseGeneratedFiles = (response: string): Record<string, string> | null => {
    const files: Record<string, string> = {};
    const codeBlockRegex = /```(?:typescript|javascript|tsx|jsx|css|html)?\s*(?:\/\/\s*(.+?)\s*)?\n([\s\S]*?)```/g;

    let match;
    let found = false;

    // Strategy 1: Look for code blocks
    while ((match = codeBlockRegex.exec(response)) !== null) {
        found = true;
        let filename = match[1];
        const content = match[2];

        // If filename not in code fence, try to find it in the first line of content
        if (!filename) {
            const firstLineMatch = content.match(/^\/\/\s*(.+?)\s*$/m);
            if (firstLineMatch) {
                filename = firstLineMatch[1];
            }
        }

        // Clean filename (remove path if needed, though sandpack handles paths)
        if (filename) {
            // Normalize path: remove leading ./ or /
            filename = filename.replace(/^(\.\/|\/)/, '');
            // Ensure leading slash for sandpack if it expects it (Sandpack usually maps relative to root)
            // But let's verify if Sandpack needs /App.tsx or App.tsx. Usually App.tsx is fine.
            files[`/${filename}`] = content.trim();
        }
    }

    if (!found) {
        // Fallback or specific logic if no code blocks are found
        return null;
    }

    return Object.keys(files).length > 0 ? files : null;
};
