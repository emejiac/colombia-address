import { describe, expect, it } from 'vitest';
import { addressKey, formatAddress, isSameAddress, normalizeAddress, parseAddress } from '../src';

describe('formatAddress', () => {
  const parsed = parseAddress('kr 43a no.1s-50 apto 301 torre 2, Barrio El Poblado, Medellín')!;

  it('long (default)', () => {
    expect(formatAddress(parsed)).toBe(
      'Carrera 43A # 1 Sur - 50, Apartamento 301 Torre 2, Barrio El Poblado, Medellín',
    );
  });

  it('short', () => {
    expect(formatAddress(parsed, { style: 'short' })).toBe(
      'Cra 43A # 1 Sur - 50, Apto 301 Torre 2, Barrio El Poblado, Medellín',
    );
  });

  it('code (no barrio/city unless asked)', () => {
    expect(formatAddress(parsed, { style: 'code' })).toBe('KR 43 A 1 SUR 50 AP 301 TO 2');
    expect(formatAddress(parsed, { style: 'code', includeRest: true })).toBe(
      'KR 43 A 1 SUR 50 AP 301 TO 2 BR EL POBLADO',
    );
  });

  it('without rest', () => {
    expect(formatAddress(parsed, { includeRest: false })).toBe(
      'Carrera 43A # 1 Sur - 50, Apartamento 301 Torre 2',
    );
  });

  it('bis', () => {
    expect(normalizeAddress('cl 7 bis a #4-15')).toBe('Calle 7 Bis A # 4 - 15');
    expect(normalizeAddress('cl 7 bis a #4-15', { style: 'code' })).toBe('CL 7 BIS A 4 15');
  });

  it('named avenues', () => {
    expect(normalizeAddress('av el poblado #10-20')).toBe('Avenida el poblado # 10 - 20');
    expect(normalizeAddress('Av El Poblado #10-20', { style: 'code' })).toBe('AV EL POBLADO 10 20');
  });

  it('separates a building name from the next complement', () => {
    expect(normalizeAddress('Cra 43A # 5A-113 Ed. Parque Lleras Apto 1201')).toBe(
      'Carrera 43A # 5A - 113, Edificio Parque Lleras, Apartamento 1201',
    );
  });

  it('unassigned quadrant', () => {
    expect(normalizeAddress('Circular 2 # 70 - 10 Sur')).toBe('Circular 2 # 70 - 10 Sur');
  });

  it('round-trips: formatting a formatted address gives the same thing', () => {
    for (const input of [
      'Carrera 43A # 1 Sur - 50, Apartamento 301',
      'Calle 7 Bis A # 4 - 15',
      'Avenida Calle 26 # 69D - 91, Torre 1 Piso 8',
      'Diagonal 75B # 2A - 80, Interior 140',
      'Avenida El Poblado # 10 - 20',
    ]) {
      expect(normalizeAddress(input)).toBe(input);
    }
  });

  it('normalizeAddress returns null for garbage', () => {
    expect(normalizeAddress('lo de siempre')).toBeNull();
  });
});

describe('isSameAddress', () => {
  it('same place, written differently', () => {
    expect(isSameAddress('Cra 43A #1 sur-50', 'Carrera 43 A No. 1 - 50 Sur')).toBe(true);
    expect(isSameAddress('Cl53#45-30', 'CALLE 53 # 45 - 30')).toBe(true);
    expect(isSameAddress('Circular 1 # 70-01', 'Cq 1 # 70 - 1')).toBe(true);
  });

  it('Avenida Calle 26 is Calle 26', () => {
    expect(isSameAddress('Av. Calle 26 # 69D-91', 'Calle 26 # 69D-91')).toBe(true);
    expect(isSameAddress('AK 15 # 92-33', 'Carrera 15 # 92-33')).toBe(true);
  });

  it('complement order does not matter, values do', () => {
    expect(isSameAddress('Calle 10 # 43-50 Torre 2 Apto 301', 'Calle 10 # 43-50 apto 301 torre 2')).toBe(
      true,
    );
    expect(isSameAddress('Calle 10 # 43-50 Apto 301', 'Calle 10 # 43-50 Apto 302')).toBe(false);
  });

  it('same building, ignoring complements', () => {
    expect(
      isSameAddress('Calle 10 # 43-50 Apto 301', 'Calle 10 # 43-50 Apto 302', { ignoreComplements: true }),
    ).toBe(true);
  });

  it('different places', () => {
    expect(isSameAddress('Calle 10 # 43-50', 'Carrera 10 # 43-50')).toBe(false);
    expect(isSameAddress('Calle 10 # 43-50', 'Calle 10 Sur # 43-50')).toBe(false);
    expect(isSameAddress('Calle 10 # 43A-50', 'Calle 10 # 43B-50')).toBe(false);
  });

  it('barrio and city are ignored', () => {
    expect(isSameAddress('Calle 10 # 43-50, Laureles', 'Calle 10 # 43-50, Medellín')).toBe(true);
  });

  it('false if either is not an address', () => {
    expect(isSameAddress('Calle 10 # 43-50', 'nope')).toBe(false);
  });

  it('accepts parsed objects too', () => {
    const a = parseAddress('Calle 10 # 43-50')!;
    expect(isSameAddress(a, 'cl 10 #43-50')).toBe(true);
    expect(addressKey(a)).toBe('Calle|10|43|50|');
  });
});
