/** One labelled part of an AI visit summary, e.g. { label: 'Doctor', text: 'Sheetal Rangar' } */
export interface SummaryItem {
  label: string;
  text: string;
  /** The AI suggested this (not documented by the doctor) */
  suggestion: boolean;
}

const SUGGESTION_PREFIX = /^AI suggestion\s*[-–:]\s*verify:\s*/i;

/**
 * Turns the AI's Markdown-style visit summary ("- **Doctor:** Sheetal Rangar", "**Visit Summary**") into labelled
 * plain-text items. Nothing is rendered as HTML: asterisks are removed and the text is shown as text.
 */
export function parseVisitSummary(summary: string | null | undefined): SummaryItem[] {
  const items: SummaryItem[] = [];
  for (const raw of String(summary ?? '').split(/\r?\n/)) {
    let line = raw.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '');
    if (!line) continue;

    let label = '';
    let text = line;
    const bold = /^\*\*(.+?)\*\*:?\s*(.*)$/.exec(line);
    const plain = /^([A-Z][A-Za-z ()/'-]{1,40}):\s+(.+)$/.exec(line);
    if (bold) {
      label = bold[1];
      text = bold[2];
    } else if (plain) {
      label = plain[1];
      text = plain[2];
    }
    label = label.replace(/:\s*$/, '').replace(/\*\*/g, '').trim();
    text = text.replace(/\*\*/g, '').trim();

    // A title line on its own ("**Visit Summary**") adds nothing under the "After your visit" heading
    if (label && !text && /^visit summary$/i.test(label)) continue;

    let suggestion = false;
    if (/\(?\s*AI suggestion\s*\)?/i.test(label)) {
      suggestion = true;
      label = label.replace(/\(?\s*AI suggestion\s*\)?/i, '').trim();
    }
    if (SUGGESTION_PREFIX.test(text)) {
      suggestion = true;
      text = text.replace(SUGGESTION_PREFIX, '');
    }

    // Plain sentences without a label continue the previous item
    if (!label && items.length > 0 && !suggestion) {
      items[items.length - 1].text += (items[items.length - 1].text ? '\n' : '') + text;
      continue;
    }
    items.push({ label, text, suggestion });
  }
  return items;
}
