import { parseMedicines } from './medicines.util';

describe('parseMedicines', () => {
  it('makes one row per line, with the dose from the matching line', () => {
    expect(parseMedicines('Paracetamol 500 mg\nCetirizine 10 mg', '1 tablet, twice daily, after meals\n1 tablet at night'))
      .toEqual([
        { name: 'Paracetamol 500 mg', dosage: '1 tablet, twice daily, after meals' },
        { name: 'Cetirizine 10 mg', dosage: '1 tablet at night' }
      ]);
  });

  it('still reads older records separated by semicolons or commas', () => {
    expect(parseMedicines('Paracetamol; Cetirizine', '1 tab BD; 1 tab HS').map(r => r.name)).toEqual(['Paracetamol', 'Cetirizine']);
    expect(parseMedicines('Paracetamol, Cetirizine', '1 tab BD, 1 tab HS')[1]).toEqual({ name: 'Cetirizine', dosage: '1 tab HS' });
  });

  it('keeps a dose with commas whole when it cannot be matched per medicine', () => {
    expect(parseMedicines('Paracetamol 500 mg', '1 tablet, twice daily, for 5 days'))
      .toEqual([{ name: 'Paracetamol 500 mg', dosage: '1 tablet, twice daily, for 5 days' }]);
  });

  it('keeps doses aligned when a medicine has no dose', () => {
    expect(parseMedicines('Paracetamol\nCetirizine\nORS', '1 tab BD\n\n1 sachet after each loose stool'))
      .toEqual([
        { name: 'Paracetamol', dosage: '1 tab BD' },
        { name: 'Cetirizine', dosage: undefined },
        { name: 'ORS', dosage: '1 sachet after each loose stool' }
      ]);
  });

  it('drops list markers and empty lines', () => {
    expect(parseMedicines('- Paracetamol\n\n2. Cetirizine', null).map(r => r.name)).toEqual(['Paracetamol', 'Cetirizine']);
    expect(parseMedicines('', '')).toEqual([]);
  });
});
