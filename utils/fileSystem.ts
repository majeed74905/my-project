
export interface FileSystem {
    [filename: string]: string;
}

export const initialFileSystem: FileSystem = {
    "/App.tsx": `import React from "react";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4", padding: "2rem", textAlign: "center" }}>
      <h1>Welcome to Zara Architect</h1>
      <p>Start typing in the chat to generate an application.</p>
    </div>
  );
}`,
    "/styles.css": "body { margin: 0; padding: 0; font-family: sans-serif; }"
};

export const updateFileSystem = (current: FileSystem, updates: Partial<FileSystem>): FileSystem => {
    return { ...current, ...updates };
};
