import {
  CALLE_LIKE,
  CARRERA_LIKE,
  COMPLEMENT_ALIASES,
  NAMED_VIAS,
  NUMBER_SIGNS,
  QUADRANTS,
  VIA_ALIASES,
} from './dictionary';
import { Cursor, tokenize, type Token } from './tokenize';
import type { Complement, ParsedAddress, Quadrant, StreetNumber, ViaType } from './types';

const isNumber = (t?: Token) => !!t && /^\d{1,4}$/.test(t.norm);

/**
 * A street letter: 'A', 'B'... or a double one like 'AA' (Medellín has Calle 47AA).
 * 'S' is never a letter here, it's always Sur. If you mean 'E' as Este, write 'Este':
 * a single 'E' is read as a letter because Calle 10E exists in some cities.
 */
const isLetter = (t?: Token) => !!t && (/^[a-rt-z]$/.test(t.norm) || /^[a-h]{2}$/.test(t.norm));

function readViaType(c: Cursor): ViaType | undefined {
  const first = c.peek()?.norm;
  if (!first) return undefined;

  // 'Avenida Calle 26' / 'Av. Cra 68' are their own type, so look one token ahead
  if (VIA_ALIASES[first] === 'Avenida') {
    const second = VIA_ALIASES[c.peek(1)?.norm ?? ''];
    if (second === 'Calle' || second === 'Carrera') {
      c.next();
      c.next();
      return second === 'Calle' ? 'Avenida Calle' : 'Avenida Carrera';
    }
  }

  const type = VIA_ALIASES[first];
  if (type) c.next();
  return type;
}

function readStreetNumber(c: Cursor): StreetNumber | undefined {
  const first = c.peek();
  if (!isNumber(first)) return undefined;
  c.next();

  const street: StreetNumber = { number: first!.norm };

  for (;;) {
    const t = c.peek();
    if (!t) break;

    if (!street.letter && !street.bis && !street.quadrant && isLetter(t)) {
      street.letter = t.norm.toUpperCase();
      c.next();
      continue;
    }

    if (!street.bis && !street.quadrant && t.norm === 'bis') {
      street.bis = true;
      c.next();
      const after = c.peek();
      if (after && /^[a-rt-z]$/.test(after.norm)) {
        street.bisLetter = after.norm.toUpperCase();
        c.next();
      }
      continue;
    }

    const quadrant = QUADRANTS[t.norm];
    if (!street.quadrant && quadrant) {
      street.quadrant = quadrant;
      c.next();
      continue;
    }

    break;
  }

  return street;
}

function skipNumberSign(c: Cursor): boolean {
  let skipped = false;
  while (c.peek() && NUMBER_SIGNS.has(c.peek()!.norm)) {
    c.next();
    skipped = true;
  }
  return skipped;
}

interface Extras {
  complements: Complement[];
  neighborhood?: string;
  rest: string[];
}

const isCodeValue = (t?: Token) =>
  !!t && (/^\d{1,5}$/.test(t.norm) || (/^[a-z]{1,2}$/.test(t.norm) && !COMPLEMENT_ALIASES[t.norm]));

/**
 * Does a new complement start here? 'Torre' only counts if a value follows
 * ('Torre 2' yes, 'Edificio Torre Colpatria' no: that Torre is part of the name).
 */
function startsComplement(c: Cursor): boolean {
  const def = COMPLEMENT_ALIASES[c.peek()?.norm ?? ''];
  if (!def) return false;
  if (def.kind === 'name') return true;
  const next = NUMBER_SIGNS.has(c.peek(1)?.norm ?? '') ? c.peek(2) : c.peek(1);
  return isCodeValue(next);
}

/** Reads 'Apto 301 Torre 2 Edificio Coltejer Barrio Laureles' and friends. */
function readComplements(tokens: Token[], extras: Extras): void {
  const c = new Cursor(tokens);
  const leftovers: string[] = [];

  while (!c.done) {
    const keyword = c.peek()!;
    const def = COMPLEMENT_ALIASES[keyword.norm];
    if (!def) {
      leftovers.push(c.next()!.raw);
      continue;
    }
    c.next();
    skipNumberSign(c);

    if (def.kind === 'name') {
      const words: string[] = [];
      while (!c.done && !startsComplement(c)) words.push(c.next()!.raw);
      if (words.length === 0) {
        leftovers.push(keyword.raw);
      } else if (def.type === 'Barrio') {
        extras.neighborhood = words.join(' ');
      } else {
        extras.complements.push({ type: def.type, value: words.join(' ') });
      }
      continue;
    }

    // Code-like values: '301', '2', 'B', '301B'. Anything longer is probably
    // a name ('Torre del Bosque'), and that's not ours to guess.
    const value = c.peek();
    if (value && /^\d{1,5}$/.test(value.norm)) {
      c.next();
      let text = value.norm;
      if (isLetter(c.peek()) && !COMPLEMENT_ALIASES[c.peek()!.norm]) text += c.next()!.norm.toUpperCase();
      extras.complements.push({ type: def.type, value: text });
    } else if (value && /^[a-z]{1,2}$/.test(value.norm) && !COMPLEMENT_ALIASES[value.norm]) {
      c.next();
      extras.complements.push({ type: def.type, value: value.norm.toUpperCase() });
    } else {
      leftovers.push(keyword.raw);
    }
  }

  if (leftovers.length) extras.rest.push(leftovers.join(' '));
}

/**
 * A trailing 'Sur' or 'Este' ('Carrera 43A # 1 - 50 Sur') belongs to one of the two
 * streets: Sur/Norte go with the calle, Este/Oeste with the carrera. Moving it there
 * makes 'Cra 43A # 1 Sur - 50' and 'Cra 43A # 1 - 50 Sur' the same address, which
 * they are.
 */
function placeQuadrant(address: ParsedAddress, quadrant: Quadrant): void {
  const northSouth = quadrant === 'Sur' || quadrant === 'Norte';
  const viaGetsIt = northSouth ? CALLE_LIKE.has(address.type) : CARRERA_LIKE.has(address.type);
  const crossGetsIt = northSouth ? CARRERA_LIKE.has(address.type) : CALLE_LIKE.has(address.type);

  const target = viaGetsIt ? address.street : crossGetsIt ? address.cross : undefined;
  if (target && !target.quadrant) target.quadrant = quadrant;
  else address.quadrant = quadrant;
}

/**
 * Parses a Colombian urban address. Returns `null` when it doesn't look like one
 * (rural addresses like 'Km 5 vía Las Palmas' or 'Vereda X' are not supported yet).
 *
 * @example
 * parseAddress('Kr 43 A No. 1S - 50 apto 301')
 * // { type: 'Carrera', street: { number: '43', letter: 'A' },
 * //   cross: { number: '1', quadrant: 'Sur' }, plate: '50',
 * //   complements: [{ type: 'Apartamento', value: '301' }] }
 */
export function parseAddress(input: string): ParsedAddress | null {
  if (typeof input !== 'string' || !input.trim()) return null;

  // Anything after a comma is complements, barrio or city: 'Cra 43A # 1 Sur - 50, Apto 301, Medellín'
  const [core = '', ...segments] = input.split(/[,;]/);
  const c = new Cursor(tokenize(core));

  const type = readViaType(c);
  if (!type) return null;

  let street: StreetNumber | undefined;
  let name: string | undefined;

  if (isNumber(c.peek())) {
    street = readStreetNumber(c);
  } else if (NAMED_VIAS.has(type)) {
    const words: string[] = [];
    while (!c.done && !NUMBER_SIGNS.has(c.peek()!.norm)) words.push(c.next()!.raw);
    // Without the '#' we can't tell where the name ends and the numbers start
    if (!words.length || c.done) return null;
    name = words.join(' ');
  } else {
    return null;
  }

  skipNumberSign(c);
  const cross = readStreetNumber(c);
  if (!cross) return null;

  if (c.peek()?.norm === '-') c.next();
  const plate = c.peek();
  if (!isNumber(plate)) return null;
  c.next();

  const address: ParsedAddress = { type, cross, plate: plate!.norm, complements: [] };
  if (street) address.street = street;
  if (name) address.name = name;

  const trailing = QUADRANTS[c.peek()?.norm ?? ''];
  if (trailing) {
    c.next();
    placeQuadrant(address, trailing);
  }

  const extras: Extras = { complements: [], rest: [] };
  const remaining: Token[] = [];
  while (!c.done) remaining.push(c.next()!);
  readComplements(remaining, extras);
  for (const segment of segments) {
    const tokens = tokenize(segment);
    if (!tokens.length) continue;
    // ', Bogotá D.C.' or ', frente al parque': keep it exactly as written.
    // ', Apto 301' or ', Barrio Laureles': parse it.
    if (startsComplement(new Cursor(tokens))) readComplements(tokens, extras);
    else extras.rest.push(segment.trim());
  }

  address.complements = extras.complements;
  if (extras.neighborhood) address.neighborhood = extras.neighborhood;
  if (extras.rest.length) address.rest = extras.rest.join(', ');

  return address;
}

/** Quick check, same rules as `parseAddress`. */
export function isValidAddress(input: string): boolean {
  return parseAddress(input) !== null;
}
