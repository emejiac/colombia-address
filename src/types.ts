/** Kinds of street ("vía") used in Colombian urban addresses. */
export type ViaType =
  | 'Calle'
  | 'Carrera'
  | 'Avenida'
  | 'Avenida Calle'
  | 'Avenida Carrera'
  | 'Diagonal'
  | 'Transversal'
  | 'Circular'
  | 'Circunvalar'
  | 'Autopista';

export type Quadrant = 'Sur' | 'Norte' | 'Este' | 'Oeste';

export type ComplementType =
  | 'Apartamento'
  | 'Torre'
  | 'Interior'
  | 'Bloque'
  | 'Casa'
  | 'Local'
  | 'Oficina'
  | 'Piso'
  | 'Edificio'
  | 'Conjunto'
  | 'Unidad'
  | 'Urbanización'
  | 'Etapa'
  | 'Manzana'
  | 'Lote'
  | 'Consultorio'
  | 'Bodega';

/**
 * One numbered street inside an address, e.g. the "43A" in "Carrera 43A"
 * or the "1 Sur" in "# 1 Sur - 50".
 */
export interface StreetNumber {
  /** As written, e.g. '43'. Kept as a string so '01' stays '01'. */
  number: string;
  /** 'A', 'B', 'AA'... */
  letter?: string;
  bis?: boolean;
  /** The letter after Bis: 'Calle 7 Bis A' -> 'A'. */
  bisLetter?: string;
  quadrant?: Quadrant;
}

export interface Complement {
  type: ComplementType;
  value: string;
}

export interface ParsedAddress {
  type: ViaType;
  /** Main street number. Missing only for named avenues ('Avenida El Poblado'). */
  street?: StreetNumber;
  /** Named avenues: 'El Poblado', 'Boyacá'. */
  name?: string;
  /** The street after the '#'. */
  cross: StreetNumber;
  /** The number after the '-', distance in meters from the corner. */
  plate: string;
  /** Only set when a trailing 'Sur'/'Este' can't be assigned to a street. */
  quadrant?: Quadrant;
  complements: Complement[];
  /** Only when written explicitly as 'Barrio X'. */
  neighborhood?: string;
  /** Whatever we couldn't classify (city, building names, references...). */
  rest?: string;
}
