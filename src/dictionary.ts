import type { ComplementType, Quadrant, ViaType } from './types';

/**
 * Every way I've seen people write these in real forms. Ojo: keys are lowercase,
 * without accents and without dots, the tokenizer takes care of that.
 */
export const VIA_ALIASES: Record<string, ViaType> = {
  calle: 'Calle',
  cl: 'Calle',
  cll: 'Calle',
  clle: 'Calle',
  call: 'Calle',
  carrera: 'Carrera',
  cra: 'Carrera',
  cr: 'Carrera',
  kr: 'Carrera',
  kra: 'Carrera',
  crr: 'Carrera',
  carr: 'Carrera',
  avenida: 'Avenida',
  av: 'Avenida',
  avda: 'Avenida',
  ave: 'Avenida',
  ac: 'Avenida Calle',
  ak: 'Avenida Carrera',
  diagonal: 'Diagonal',
  dg: 'Diagonal',
  diag: 'Diagonal',
  transversal: 'Transversal',
  tv: 'Transversal',
  tr: 'Transversal',
  trans: 'Transversal',
  transv: 'Transversal',
  tranv: 'Transversal',
  circular: 'Circular',
  cq: 'Circular',
  cir: 'Circular',
  circ: 'Circular',
  circunvalar: 'Circunvalar',
  cv: 'Circunvalar',
  crv: 'Circunvalar',
  circunv: 'Circunvalar',
  autopista: 'Autopista',
  au: 'Autopista',
  aut: 'Autopista',
  autop: 'Autopista',
};

/** Vias that can have a name instead of a number ('Avenida El Poblado'). */
export const NAMED_VIAS: ReadonlySet<ViaType> = new Set(['Avenida', 'Autopista', 'Circunvalar', 'Circular']);

/** Calle-like streets carry Sur/Norte, carrera-like ones carry Este/Oeste. */
export const CALLE_LIKE: ReadonlySet<ViaType> = new Set(['Calle', 'Avenida Calle', 'Diagonal']);
export const CARRERA_LIKE: ReadonlySet<ViaType> = new Set(['Carrera', 'Avenida Carrera', 'Transversal']);

export const QUADRANTS: Record<string, Quadrant> = {
  sur: 'Sur',
  s: 'Sur',
  norte: 'Norte',
  este: 'Este',
  oeste: 'Oeste',
};

/** Words that mean "the '#' goes here": 'No.', 'Nro', 'Número'... */
export const NUMBER_SIGNS: ReadonlySet<string> = new Set(['#', 'no', 'nro', 'num', 'numero']);

type ComplementDef =
  { type: ComplementType; kind: 'code' } | { type: ComplementType | 'Barrio'; kind: 'name' };

const code = (type: ComplementType): ComplementDef => ({ type, kind: 'code' });
const name = (type: ComplementType | 'Barrio'): ComplementDef => ({ type, kind: 'name' });

export const COMPLEMENT_ALIASES: Record<string, ComplementDef> = {
  apartamento: code('Apartamento'),
  apto: code('Apartamento'),
  apt: code('Apartamento'),
  ap: code('Apartamento'),
  apart: code('Apartamento'),
  torre: code('Torre'),
  to: code('Torre'),
  tor: code('Torre'),
  interior: code('Interior'),
  int: code('Interior'),
  in: code('Interior'),
  bloque: code('Bloque'),
  bl: code('Bloque'),
  blq: code('Bloque'),
  bloq: code('Bloque'),
  casa: code('Casa'),
  ca: code('Casa'),
  local: code('Local'),
  lc: code('Local'),
  loc: code('Local'),
  oficina: code('Oficina'),
  of: code('Oficina'),
  ofi: code('Oficina'),
  ofc: code('Oficina'),
  ofic: code('Oficina'),
  piso: code('Piso'),
  pi: code('Piso'),
  etapa: code('Etapa'),
  et: code('Etapa'),
  manzana: code('Manzana'),
  mz: code('Manzana'),
  mza: code('Manzana'),
  manz: code('Manzana'),
  lote: code('Lote'),
  lt: code('Lote'),
  consultorio: code('Consultorio'),
  cons: code('Consultorio'),
  bodega: code('Bodega'),
  bg: code('Bodega'),
  bod: code('Bodega'),
  edificio: name('Edificio'),
  ed: name('Edificio'),
  edif: name('Edificio'),
  conjunto: name('Conjunto'),
  conj: name('Conjunto'),
  unidad: name('Unidad'),
  und: name('Unidad'),
  urbanizacion: name('Urbanización'),
  urb: name('Urbanización'),
  barrio: name('Barrio'),
  br: name('Barrio'),
};

export const SHORT_VIA: Record<ViaType, string> = {
  Calle: 'Cl',
  Carrera: 'Cra',
  Avenida: 'Av',
  'Avenida Calle': 'Av Cl',
  'Avenida Carrera': 'Av Cra',
  Diagonal: 'Dg',
  Transversal: 'Tv',
  Circular: 'Cq',
  Circunvalar: 'Crv',
  Autopista: 'Aut',
};

/** Uppercase codes in the style used by DIAN/RUT forms and most ERPs. */
export const CODE_VIA: Record<ViaType, string> = {
  Calle: 'CL',
  Carrera: 'KR',
  Avenida: 'AV',
  'Avenida Calle': 'AC',
  'Avenida Carrera': 'AK',
  Diagonal: 'DG',
  Transversal: 'TV',
  Circular: 'CQ',
  Circunvalar: 'CV',
  Autopista: 'AU',
};

export const SHORT_COMPLEMENT: Record<ComplementType, string> = {
  Apartamento: 'Apto',
  Torre: 'Torre',
  Interior: 'Int',
  Bloque: 'Bl',
  Casa: 'Casa',
  Local: 'Local',
  Oficina: 'Of',
  Piso: 'Piso',
  Edificio: 'Ed',
  Conjunto: 'Conj',
  Unidad: 'Und',
  Urbanización: 'Urb',
  Etapa: 'Etapa',
  Manzana: 'Mz',
  Lote: 'Lote',
  Consultorio: 'Cons',
  Bodega: 'Bod',
};

export const CODE_COMPLEMENT: Record<ComplementType, string> = {
  Apartamento: 'AP',
  Torre: 'TO',
  Interior: 'IN',
  Bloque: 'BL',
  Casa: 'CA',
  Local: 'LC',
  Oficina: 'OF',
  Piso: 'PI',
  Edificio: 'ED',
  Conjunto: 'CONJ',
  Unidad: 'UN',
  Urbanización: 'URB',
  Etapa: 'ET',
  Manzana: 'MZ',
  Lote: 'LT',
  Consultorio: 'CS',
  Bodega: 'BG',
};

/** Order used when comparing addresses, so 'Torre 2 Apto 301' == 'Apto 301 Torre 2'. */
export const COMPLEMENT_ORDER: ComplementType[] = [
  'Urbanización',
  'Conjunto',
  'Unidad',
  'Edificio',
  'Etapa',
  'Manzana',
  'Lote',
  'Torre',
  'Bloque',
  'Interior',
  'Casa',
  'Piso',
  'Apartamento',
  'Oficina',
  'Consultorio',
  'Local',
  'Bodega',
];
