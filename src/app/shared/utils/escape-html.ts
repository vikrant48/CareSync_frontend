/**
 * Escapes text before our own markdown-to-HTML formatting adds tags. AI answers (and text read from scanned
 * documents) must never inject links, images or other HTML into the page.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
