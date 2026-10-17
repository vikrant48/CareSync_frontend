import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('turns HTML into plain text so AI answers cannot add links, images or scripts', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(escapeHtml("<a href='https://evil.example'>click</a>")).toBe(
      '&lt;a href=&#39;https://evil.example&#39;&gt;click&lt;/a&gt;');
  });

  it('leaves markdown markers alone so formatting still works', () => {
    expect(escapeHtml('**Fever** - rest & fluids')).toBe('**Fever** - rest &amp; fluids');
  });
});
