import { describe, expect, it } from 'vitest';
import { isValidAddress, parseAddress } from '../src';

describe('parseAddress: the basics', () => {
  it('reads a textbook address', () => {
    expect(parseAddress('Calle 10 # 43A - 50')).toEqual({
      type: 'Calle',
      street: { number: '10' },
      cross: { number: '43', letter: 'A' },
      plate: '50',
      complements: [],
    });
  });

  it.each([
    'Carrera 43A # 1 Sur - 50',
    'Cra 43a # 1 sur-50',
    'Kr 43 A No. 1S - 50',
    'CRA. 43A #1SUR-50',
    'cra 43a n° 1 sur 50',
    'Carrera 43 A Nro 1 Sur – 50',
    'KR 43A # 1 Sur - 50',
  ])('reads the same Medellín address written as %j', (input) => {
    const parsed = parseAddress(input);
    expect(parsed?.type).toBe('Carrera');
    expect(parsed?.street).toEqual({ number: '43', letter: 'A' });
    expect(parsed?.cross).toEqual({ number: '1', quadrant: 'Sur' });
    expect(parsed?.plate).toBe('50');
  });

  it('handles everything glued together', () => {
    expect(parseAddress('Cl53#45-30')).toMatchObject({
      type: 'Calle',
      street: { number: '53' },
      cross: { number: '45' },
      plate: '30',
    });
  });

  it('handles the no-separator code style', () => {
    expect(parseAddress('CL 78 SUR 20D 15')).toMatchObject({
      type: 'Calle',
      street: { number: '78', quadrant: 'Sur' },
      cross: { number: '20', letter: 'D' },
      plate: '15',
    });
  });

  it('keeps leading zeros as written', () => {
    expect(parseAddress('Circular 1 # 70-01')?.plate).toBe('01');
  });
});

describe('parseAddress: letters, bis and quadrants', () => {
  it('double letters (Medellín has these)', () => {
    expect(parseAddress('Calle 47AA # 80 - 15')?.street).toEqual({ number: '47', letter: 'AA' });
  });

  it('bis with and without letter', () => {
    expect(parseAddress('Calle 7 Bis A # 4-15')?.street).toEqual({ number: '7', bis: true, bisLetter: 'A' });
    expect(parseAddress('Cra 15 BIS # 92-33')?.street).toEqual({ number: '15', bis: true });
    expect(parseAddress('Calle 7 # 4 Bis - 15')?.cross).toEqual({ number: '4', bis: true });
  });

  it('letter + bis + letter', () => {
    expect(parseAddress('Carrera 68B Bis A # 22-10')?.street).toEqual({
      number: '68',
      letter: 'B',
      bis: true,
      bisLetter: 'A',
    });
  });

  it('moves a trailing Sur to the calle', () => {
    // Carrera: the cross street is the calle
    expect(parseAddress('Carrera 43A # 1 - 50 Sur')?.cross).toEqual({ number: '1', quadrant: 'Sur' });
    // Calle: the via itself is the calle
    expect(parseAddress('Calle 78 # 20D - 15 Sur')?.street).toEqual({ number: '78', quadrant: 'Sur' });
  });

  it('moves a trailing Este to the carrera', () => {
    expect(parseAddress('Calle 10 # 5 - 20 Este')?.cross).toEqual({ number: '5', quadrant: 'Este' });
    expect(parseAddress('Carrera 1 # 10 - 20 Este')?.street).toEqual({ number: '1', quadrant: 'Este' });
  });

  it('keeps the quadrant on the address when it has nowhere to go', () => {
    expect(parseAddress('Circular 2 # 70 - 10 Sur')?.quadrant).toBe('Sur');
  });

  it('Norte (Cali style)', () => {
    expect(parseAddress('Avenida 6 Norte # 23-45')?.street).toEqual({ number: '6', quadrant: 'Norte' });
  });
});

describe('parseAddress: via types', () => {
  it.each([
    ['Calle 10 # 5-20', 'Calle'],
    ['Cll 10 # 5-20', 'Calle'],
    ['Carrera 10 # 5-20', 'Carrera'],
    ['Avenida 80 # 65-20', 'Avenida'],
    ['Av. Calle 26 # 69D - 91', 'Avenida Calle'],
    ['AC 26 # 69D - 91', 'Avenida Calle'],
    ['Av Cra 68 # 22-10', 'Avenida Carrera'],
    ['AK 15 # 92-33', 'Avenida Carrera'],
    ['Diagonal 75B # 2A - 80', 'Diagonal'],
    ['Dg 75B # 2A - 80', 'Diagonal'],
    ['Transversal 39B # 74 - 23', 'Transversal'],
    ['Tv 39B # 74 - 23', 'Transversal'],
    ['Circular 1 # 70-01', 'Circular'],
    ['Circunvalar 5 # 12-30', 'Circunvalar'],
  ])('%s -> %s', (input, type) => {
    expect(parseAddress(input)?.type).toBe(type);
  });

  it('named avenues', () => {
    expect(parseAddress('Avenida El Poblado # 10-20')).toMatchObject({
      type: 'Avenida',
      name: 'El Poblado',
      cross: { number: '10' },
      plate: '20',
    });
    expect(parseAddress('Av. Boyacá # 12-30')?.name).toBe('Boyacá');
  });

  it('a named avenue needs the # to know where the name ends', () => {
    expect(parseAddress('Avenida Boyacá 12 30')).toBeNull();
  });
});

describe('parseAddress: complements', () => {
  it('apartment, tower, floor...', () => {
    expect(parseAddress('Av. Calle 26 # 69D - 91 Torre 1 Piso 8')?.complements).toEqual([
      { type: 'Torre', value: '1' },
      { type: 'Piso', value: '8' },
    ]);
    expect(parseAddress('Kr 43 A No. 1S - 50 apto 301')?.complements).toEqual([
      { type: 'Apartamento', value: '301' },
    ]);
  });

  it('abbreviations and glued values', () => {
    expect(parseAddress('Calle 10 # 43 - 50 apto301 int 2 of. 504')?.complements).toEqual([
      { type: 'Apartamento', value: '301' },
      { type: 'Interior', value: '2' },
      { type: 'Oficina', value: '504' },
    ]);
  });

  it('letter values and number+letter values', () => {
    expect(parseAddress('Calle 10 # 43 - 50 Torre B Apto 301B')?.complements).toEqual([
      { type: 'Torre', value: 'B' },
      { type: 'Apartamento', value: '301B' },
    ]);
  });

  it('named complements keep their original spelling', () => {
    expect(parseAddress('Carrera 7 # 72-41 Edificio Torre Colpatria')?.complements).toEqual([
      { type: 'Edificio', value: 'Torre Colpatria' },
    ]);
    expect(
      parseAddress('Calle 10 # 43 - 50 Conjunto Balcones de San Lucas Torre 2 Apto 301')?.complements,
    ).toEqual([
      { type: 'Conjunto', value: 'Balcones de San Lucas' },
      { type: 'Torre', value: '2' },
      { type: 'Apartamento', value: '301' },
    ]);
  });

  it('complements, barrio and city after commas', () => {
    expect(parseAddress('Cra 43A # 1 Sur - 50, Apto 301, Barrio El Poblado, Medellín')).toMatchObject({
      complements: [{ type: 'Apartamento', value: '301' }],
      neighborhood: 'El Poblado',
      rest: 'Medellín',
    });
  });

  it('text after a comma stays exactly as written', () => {
    expect(parseAddress('Avenida Carrera 68 # 22-10, Bogotá D.C.')?.rest).toBe('Bogotá D.C.');
  });

  it('a lonely keyword without value is not a complement', () => {
    const parsed = parseAddress('Calle 10 # 43 - 50 apto');
    expect(parsed?.complements).toEqual([]);
    expect(parsed?.rest).toBe('apto');
  });

  it('casa, manzana, lote (common in urbanizaciones)', () => {
    expect(parseAddress('Carrera 50 # 10 - 20 casa 3 mz 4 lote 7')?.complements).toEqual([
      { type: 'Casa', value: '3' },
      { type: 'Manzana', value: '4' },
      { type: 'Lote', value: '7' },
    ]);
  });

  it('anything unknown ends up in rest instead of breaking the parse', () => {
    expect(parseAddress('Calle 10 # 43 - 50 frente al parque, Envigado')?.rest).toBe(
      'frente al parque, Envigado',
    );
  });

  it("doesn't invent a complement out of a name", () => {
    const parsed = parseAddress('Calle 10 # 43 - 50, Torre del Bosque');
    expect(parsed?.complements).toEqual([]);
    expect(parsed?.rest).toBe('Torre del Bosque');
  });
});

describe('parseAddress: rejects what is not an address', () => {
  it.each([
    '',
    '   ',
    'hola',
    'Km 5 vía Las Palmas',
    'Vereda El Salado',
    'Calle',
    'Calle 10',
    'Calle 10 # 43',
    'Calle 10 # 43 -',
    'Edificio Coltejer',
  ])('%j -> null', (input) => {
    expect(parseAddress(input)).toBeNull();
  });

  it('non-strings', () => {
    expect(parseAddress(undefined as unknown as string)).toBeNull();
    expect(parseAddress(123 as unknown as string)).toBeNull();
  });

  it('isValidAddress', () => {
    expect(isValidAddress('Cra 43A # 1 Sur - 50')).toBe(true);
    expect(isValidAddress('mi casa')).toBe(false);
  });
});
