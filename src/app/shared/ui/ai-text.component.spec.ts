import { parseAiText } from './ai-text.component';

describe('parseAiText', () => {
  it('reads headings, bullets, nested bullets, bold and italic as plain text', () => {
    const blocks = parseAiText(
      '## Medical History Overview\nNo chronic conditions.\n### Timeline\n'
      + '* **2026-10-11:** Emergency visit → *Viral fever* (Completed)\n  * Additional entry: **fever**');

    expect(blocks.map(b => [b.kind, b.level])).toEqual([
      ['heading', 2], ['paragraph', 0], ['heading', 3], ['bullet', 0], ['bullet', 1]
    ]);
    expect(blocks[3].segments).toEqual([
      { text: '2026-10-11:', bold: true },
      { text: ' Emergency visit → ' },
      { text: 'Viral fever', italic: true },
      { text: ' (Completed)' }
    ]);
  });

  it('turns a line that is all bold into a small heading and drops stray markers', () => {
    const blocks = parseAiText('**Chronic Conditions**\nSome ** text');
    expect(blocks[0]).toEqual({ kind: 'heading', level: 3, segments: [{ text: 'Chronic Conditions', bold: true }] });
    expect(blocks[1].segments.map(s => s.text).join('')).toBe('Some  text');
  });

  it('never keeps HTML as markup: it stays text', () => {
    expect(parseAiText('<img src=x onerror=alert(1)>')[0].segments[0].text).toBe('<img src=x onerror=alert(1)>');
  });
});
