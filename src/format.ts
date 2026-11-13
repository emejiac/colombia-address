import { CODE_COMPLEMENT, CODE_VIA, COMPLEMENT_ORDER, SHORT_COMPLEMENT, SHORT_VIA } from './dictionary';
import { parseAddress } from './parse';
import type { ComplementType, ParsedAddress, StreetNumber } from './types';

const NAME_COMPLEMENTS: ReadonlySet<ComplementType> = new Set([
  'Edificio',
  'Conjunto',
  'Unidad',
  'Urbanización',
]);

export type FormatStyle = 'long' | 'short' | 'code';

export interface FormatOptions {
  /**
   * - `long`: 'Carrera 43A # 1 Sur - 50, Apartamento 301' (default, for humans)
   * - `short`: 'Cra 43A # 1 Sur - 50, Apto 301' (labels, SMS, small screens)
   * - `code`: 'KR 43 A 1 SUR 50 AP 301' (ERPs, DIAN/RUT-style forms, comparing)
   */
  style?: FormatStyle;
  /** Include neighborhood and unclassified text at the end. Default: true (not in `code`). */
  includeRest?: boolean;
}

function streetText(s: StreetNumber, style: FormatStyle): string {
  if (style === 'code') {
    return [s.number, s.letter, s.bis && 'BIS', s.bisLetter, s.quadrant?.toUpperCase()]
      .filter(Boolean)
      .join(' ');
  }
  let text = s.number + (s.letter ?? '');
  if (s.bis) text += ' Bis' + (s.bisLetter ? ` ${s.bisLetter}` : '');
  if (s.quadrant) text += ` ${s.quadrant}`;
  return text;
}

/** Turns a parsed address back into text, consistently. */
export function formatAddress(address: ParsedAddress, options: FormatOptions = {}): string {
  const style = options.style ?? 'long';
  const includeRest = options.includeRest ?? style !== 'code';

  const via =
    style === 'code' ? CODE_VIA[address.type] : style === 'short' ? SHORT_VIA[address.type] : address.type;
  const first = address.street
    ? streetText(address.street, style)
    : style === 'code'
      ? (address.name ?? '').toUpperCase()
      : (address.name ?? '');
  const cross = streetText(address.cross, style);
  const quadrant = address.quadrant
    ? style === 'code'
      ? address.quadrant.toUpperCase()
      : address.quadrant
    : '';

  const complements = address.complements.map((c) => {
    const label =
      style === 'code' ? CODE_COMPLEMENT[c.type] : style === 'short' ? SHORT_COMPLEMENT[c.type] : c.type;
    return `${label} ${style === 'code' ? c.value.toUpperCase() : c.value}`;
  });

  if (style === 'code') {
    const parts = [via, first, cross, address.plate, quadrant, ...complements];
    if (includeRest && address.neighborhood) parts.push('BR', address.neighborhood.toUpperCase());
    return parts.filter(Boolean).join(' ');
  }

  let text = `${via} ${first} # ${cross} - ${address.plate}`;
  if (quadrant) text += ` ${quadrant}`;
  if (complements.length) {
    // 'Edificio Parque Lleras, Apartamento 1201' reads better than gluing a name to the next one
    const joined = complements.reduce(
      (acc, part, i) =>
        i === 0 ? part : acc + (NAME_COMPLEMENTS.has(address.complements[i - 1]!.type) ? ', ' : ' ') + part,
      '',
    );
    text += `, ${joined}`;
  }
  if (includeRest) {
    if (address.neighborhood) text += `, Barrio ${address.neighborhood}`;
    if (address.rest) text += `, ${address.rest}`;
  }
  return text;
}

/**
 * Parse + format in one go. Returns `null` if it's not a valid address.
 *
 * @example
 * normalizeAddress('cra 43a #1sur-50 apto 301') // 'Carrera 43A # 1 Sur - 50, Apartamento 301'
 */
export function normalizeAddress(input: string, options: FormatOptions = {}): string | null {
  const parsed = parseAddress(input);
  return parsed ? formatAddress(parsed, options) : null;
}

export interface CompareOptions {
  /** Same building = same address, ignoring Apto/Torre/etc. Handy for "how many orders go to this building". */
  ignoreComplements?: boolean;
}

/**
 * A comparable key: Avenida Calle 26 and Calle 26 are the same street, '01' == '1',
 * and complements are sorted so their order doesn't matter.
 */
export function addressKey(address: ParsedAddress, options: CompareOptions = {}): string {
  const type =
    address.type === 'Avenida Calle'
      ? 'Calle'
      : address.type === 'Avenida Carrera'
        ? 'Carrera'
        : address.type;
  const street = (s?: StreetNumber) =>
    s ? [Number(s.number), s.letter, s.bis && 'BIS', s.bisLetter, s.quadrant].filter(Boolean).join('') : '';

  const parts = [
    type,
    address.street ? street(address.street) : (address.name ?? '').toUpperCase(),
    street(address.cross),
    Number(address.plate),
    address.quadrant ?? '',
  ];

  if (!options.ignoreComplements) {
    const sorted = [...address.complements].sort(
      (a, b) => COMPLEMENT_ORDER.indexOf(a.type) - COMPLEMENT_ORDER.indexOf(b.type),
    );
    for (const c of sorted)
      parts.push(`${c.type}:${/^\d+$/.test(c.value) ? Number(c.value) : c.value.toUpperCase()}`);
  }
  return parts.join('|');
}

/**
 * Are these the same place? Works with strings or parsed addresses.
 * Returns false if either one can't be parsed.
 *
 * @example
 * isSameAddress('Cra 43A #1 sur-50', 'Carrera 43 A No. 1 - 50 Sur') // true
 */
export function isSameAddress(
  a: string | ParsedAddress,
  b: string | ParsedAddress,
  options: CompareOptions = {},
): boolean {
  const pa = typeof a === 'string' ? parseAddress(a) : a;
  const pb = typeof b === 'string' ? parseAddress(b) : b;
  if (!pa || !pb) return false;
  return addressKey(pa, options) === addressKey(pb, options);
}
