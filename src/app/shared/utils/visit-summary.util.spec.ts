import { parseVisitSummary } from './visit-summary.util';

describe('parseVisitSummary', () => {
  it('turns the AI Markdown into labelled items without asterisks', () => {
    const items = parseVisitSummary(
      '**Visit Summary**\n\n- **Doctor:** Sheetal Rangar\n- **What was discussed:** Fever for 1-3 days.\n'
      + '- **Assessment (AI suggestion):** Possible viral infection.\n- **Medicines recorded:** Paracetamol 500 mg.');

    expect(items).toEqual([
      { label: 'Doctor', text: 'Sheetal Rangar', suggestion: false },
      { label: 'What was discussed', text: 'Fever for 1-3 days.', suggestion: false },
      { label: 'Assessment', text: 'Possible viral infection.', suggestion: true },
      { label: 'Medicines recorded', text: 'Paracetamol 500 mg.', suggestion: false }
    ]);
  });

  it('marks text that starts with the AI suggestion prefix', () => {
    expect(parseVisitSummary('- **Plan:** AI suggestion - verify: Rest and fluids.'))
      .toEqual([{ label: 'Plan', text: 'Rest and fluids.', suggestion: true }]);
  });

  it('reads the plain fallback format and joins unlabelled lines to the previous item', () => {
    expect(parseVisitSummary('Doctor: Asha Rao\nPlan recorded: Not recorded\nThis summary uses only recorded facts.'))
      .toEqual([
        { label: 'Doctor', text: 'Asha Rao', suggestion: false },
        { label: 'Plan recorded', text: 'Not recorded\nThis summary uses only recorded facts.', suggestion: false }
      ]);
  });

  it('returns nothing for empty text', () => {
    expect(parseVisitSummary('')).toEqual([]);
    expect(parseVisitSummary(null)).toEqual([]);
  });
});
