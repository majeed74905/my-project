
import { ChatSession, Role } from '../types';

export const exportChatToMarkdown = (session: ChatSession | null) => {
  if (!session) return;
  const content = session.messages.map(m => 
    `### ${m.role === Role.USER ? 'User' : 'Zara AI'} (${new Date(m.timestamp).toLocaleString()})\n\n${m.text}\n`
  ).join('\n---\n\n');

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`);
};

export const exportChatToText = (session: ChatSession | null) => {
  if (!session) return;
  const content = session.messages.map(m => 
    `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleString()}:\n${m.text}\n`
  ).join('\n----------------------------------------\n\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`);
};

export const exportChatToPDF = (session: ChatSession | null) => {
  if (!session) return;
  
  // Create a print-friendly HTML structure
  const htmlContent = `
    <html>
      <head>
        <title>${session.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .message { margin-bottom: 25px; page-break-inside: avoid; }
          .meta { font-size: 12px; color: #666; margin-bottom: 4px; display: flex; justify-content: space-between; }
          .role { font-weight: bold; text-transform: uppercase; }
          .timestamp { color: #999; }
          .user .role { color: #2563eb; }
          .model .role { color: #7c3aed; }
          .content { white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 14px; border: 1px solid #eee; }
          .user .content { background: #eff6ff; border-color: #dbeafe; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${session.title}</h1>
          <p>Exported from Zara AI • ${new Date().toLocaleString()}</p>
        </div>
        ${session.messages.map(m => `
          <div class="message ${m.role}">
            <div class="meta">
              <span class="role">${m.role === 'model' ? 'Zara AI' : 'User'}</span>
              <span class="timestamp">${new Date(m.timestamp).toLocaleString()}</span>
            </div>
            <div class="content">${m.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `).join('')}
        <script>
          window.onload = () => { setTimeout(() => window.print(), 500); };
        </script>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  // Clean up url after a delay to allow print dialog to load
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

const downloadFile = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
