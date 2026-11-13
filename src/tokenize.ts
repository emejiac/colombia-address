export interface Token {
  /** As the user wrote it (keeps accents and caps for names). */
  raw: string;
  /** Lowercase, no accents. What we actually match against. */
  norm: string;
}

const stripAccents = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Splits an address into tokens.
 *
 * The tricky part is that people glue everything: 'Cl53#45-30', 'Kr 43A No.1S-50',
 * 'apto301'. So before splitting we put spaces around '#' and '-', drop the dots
 * and separate numbers from letters. After that 'Cra.43A#1Sur-50' and
 * 'Carrera 43 A # 1 Sur - 50' give the same tokens. Bacano.
 */
export function tokenize(text: string): Token[] {
  const spaced = text
    .replace(/[–—−]/g, '-') // en/em dashes from Word and WhatsApp
    .replace(/\bn\s*[°º]/giu, ' # ') // 'N°', 'Nº'
    .replace(/[°º]/g, ' ')
    .replace(/\//g, ' ')
    .replace(/[#-]/g, (m) => ` ${m} `)
    .replace(/\./g, ' ')
    .replace(/(\d)(\p{L})/gu, '$1 $2')
    .replace(/(\p{L})(\d)/gu, '$1 $2');

  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({ raw, norm: stripAccents(raw).toLowerCase() }));
}

/** Tiny cursor so the parser reads like the grammar. */
export class Cursor {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  peek(offset = 0): Token | undefined {
    return this.tokens[this.index + offset];
  }

  next(): Token | undefined {
    return this.tokens[this.index++];
  }

  get done(): boolean {
    return this.index >= this.tokens.length;
  }
}
