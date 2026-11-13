# colombia-address 🇨🇴

[![npm](https://img.shields.io/npm/v/colombia-address)](https://www.npmjs.com/package/colombia-address)
[![CI](https://github.com/emejiac/colombia-address/actions/workflows/ci.yml/badge.svg)](https://github.com/emejiac/colombia-address/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlejs/size/colombia-address)](https://bundlejs.com/?q=colombia-address)
[![license](https://img.shields.io/github/license/emejiac/colombia-address)](./LICENSE)

Parse, normalize and compare Colombian street addresses. TypeScript, zero dependencies, ~4 KB gzipped.

```bash
npm install colombia-address
```

> **En español:** parser de **direcciones colombianas**. Entiende `Cra 43A #1Sur-50`, `Kr 43 A No. 1S - 50 apto 301` y `CARRERA 43 A Nro 1 SUR – 50` como la misma dirección, la devuelve limpia (`Carrera 43A # 1 Sur - 50, Apartamento 301`), en formato corto o en código tipo DIAN (`KR 43 A 1 SUR 50 AP 301`), y te dice si dos direcciones son el mismo lugar. Ideal para checkouts, domicilios, mensajería, CRMs y limpieza de bases de datos.

Requires Node 20 or later. Works in browsers too.

## Why

If you've ever built a checkout for Colombia, you've seen this: the same address arrives as `cra 43a # 1 sur-50`, `Kr 43 A No. 1S - 50`, `Carrera 43A #1Sur-50 apto301` and `CARRERA 43 A Nro 1 SUR – 50`. Geocoders choke on half of them, duplicates pile up in the CRM, and the courier calls asking where to go.

International address parsers don't get the Colombian system (`Vía # Cruce - Placa`), so here's one that does.

## Parse

```ts
import { parseAddress } from 'colombia-address';

parseAddress('Kr 43 A No. 1S - 50 apto 301, Barrio El Poblado, Medellín');
// {
//   type: 'Carrera',
//   street: { number: '43', letter: 'A' },
//   cross: { number: '1', quadrant: 'Sur' },
//   plate: '50',
//   complements: [{ type: 'Apartamento', value: '301' }],
//   neighborhood: 'El Poblado',
//   rest: 'Medellín'
// }

parseAddress('Km 5 vía Las Palmas'); // null (rural addresses aren't supported yet)
```

It understands:

- **Vías:** Calle, Carrera, Avenida, Avenida Calle, Avenida Carrera, Diagonal, Transversal, Circular, Circunvalar, Autopista, with all the usual abbreviations (`Cl`, `Cll`, `Cra`, `Kr`, `Av`, `AC`, `AK`, `Dg`, `Tv`…).
- **Letters and bis:** `43A`, `47AA`, `7 Bis A`, `68B Bis A`.
- **Quadrants:** `Sur`, `Norte`, `Este`, `Oeste`, wherever they're written. A trailing one (`... - 50 Sur`) is moved to the street it belongs to (Sur/Norte → the calle, Este/Oeste → the carrera).
- **Separators:** `#`, `No.`, `N°`, `Nro`, `-`, `–`, or nothing at all (`CL 78 SUR 20D 15`).
- **Named avenues:** `Avenida El Poblado # 10-20`, `Av. Boyacá # 12-30`.
- **Complements:** Apartamento, Torre, Interior, Bloque, Casa, Local, Oficina, Piso, Edificio, Conjunto, Unidad, Urbanización, Etapa, Manzana, Lote, Consultorio, Bodega, and `Barrio`.
- **Everything else** (city, references like "frente al parque") goes to `rest` instead of breaking the parse.

## Normalize and format

```ts
import { normalizeAddress, formatAddress } from 'colombia-address';

normalizeAddress('cra 43a #1sur-50 apto301');
// 'Carrera 43A # 1 Sur - 50, Apartamento 301'

normalizeAddress('cra 43a #1sur-50 apto301', { style: 'short' });
// 'Cra 43A # 1 Sur - 50, Apto 301'

normalizeAddress('cra 43a #1sur-50 apto301', { style: 'code' });
// 'KR 43 A 1 SUR 50 AP 301'
```

`code` uses the uppercase abbreviations common in DIAN/RUT-style forms and ERPs. If your system has its own table, build the string from the parsed object.

## Compare

```ts
import { isSameAddress } from 'colombia-address';

isSameAddress('Cra 43A #1 sur-50', 'Carrera 43 A No. 1 - 50 Sur'); // true
isSameAddress('Av. Calle 26 # 69D-91', 'Calle 26 # 69D-91'); // true
isSameAddress('Calle 10 # 43-50 Torre 2 Apto 301', 'Calle 10 # 43-50 apto 301 torre 2'); // true
isSameAddress('Calle 10 # 43-50 Apto 301', 'Calle 10 # 43-50 Apto 302'); // false

// Same building?
isSameAddress('Calle 10 # 43-50 Apto 301', 'Calle 10 # 43-50 Apto 302', { ignoreComplements: true }); // true
```

Need to group thousands of rows? Use `addressKey(parsed)` as a `Map` key or a database column.

## Good to know

- A single `E` after a number is read as a **letter** (`Calle 10E`). If you mean Este, write `Este`.
- `S` is always **Sur**.
- Named avenues need the `#` to know where the name ends.
- Rural addresses (`Km 5 vía…`, `Vereda…`) return `null` for now.
- This library never sends addresses anywhere. Parsing happens in your code, nothing else.

## Roadmap

- [ ] Rural addresses (kilómetro, vereda, finca)
- [ ] Intersections (`Calle 10 con Carrera 43`)
- [ ] Integration with [colombia-kit](https://www.npmjs.com/package/colombia-kit) for departamentos/municipios

PRs welcome, parce. Read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## License

MIT © [Esneider Mejía Ciro](https://github.com/emejiac)
