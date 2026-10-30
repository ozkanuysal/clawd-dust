// Clawd Dust — çöl dünyası: gök, uzak kerpiç evler (paralaks), kum ve tohumlu nesneler. Saf.

import { C, h, mix } from './renk'
import { type Tuval, disk } from './tuval'
import { G, sandik, duvar, kapi } from './sprite'

export type Nesne = { tip: 'sandik' | 'duvar' | 'kapi'; x: number }

const DILIM = 40
const ILK_BOS = 60

// Dünya [bas, bit) aralığındaki nesneler: 40 piksellik dilim başına en fazla bir tane
export function nesneler(bas: number, bit: number): Nesne[] {
  const sonuc: Nesne[] = []
  for (let d = Math.floor(bas / DILIM); d * DILIM < bit; d++) {
    const x = d * DILIM
    if (x < ILK_BOS || x < bas) continue
    const r = h(d, 17)
    if (r < 0.35) sonuc.push({ tip: 'sandik', x })
    else if (r < 0.55) sonuc.push({ tip: 'duvar', x })
    else if (r < 0.65) sonuc.push({ tip: 'kapi', x })
  }
  return sonuc
}

const gok = (y: number) => mix(C.sky1, C.sky2, y / (G - 1))

export function zemin(t: Tuval, cam: number): void {
  for (let y = 0; y < G; y++) for (let x = 0; x < t.g; x++) t.p[y * t.g + x] = gok(y)
  disk(t, t.g - 16 - cam * 0.05, 2, 1.2, C.sun)
  for (let x = 0; x < t.g; x++) {
    const wx = Math.floor(x + cam * 0.35), seg = Math.floor(wx / 18), lx = ((wx % 18) + 18) % 18
    if (lx >= 16) continue
    const ust = 4 + Math.floor(h(seg, 3) * 3)
    for (let y = ust; y < G; y++) {
      let c = y === ust ? C.farD : C.far
      if (h(seg, 5) > 0.4 && lx >= 3 && lx <= 5 && y >= ust + 2 && y <= ust + 3) c = C.farD
      if (h(seg, 9) > 0.5 && lx >= 8 && lx <= 13 && y >= G - 4 && !(y === G - 4 && (lx === 8 || lx === 13))) c = gok(y)
      t.p[y * t.g + x] = c
    }
  }
  for (let x = 0; x < t.g; x++) {
    const wx = Math.floor(x + cam)
    for (let y = G; y < t.y; y++) {
      const r = h(wx, y)
      t.p[y * t.g + x] = r > 0.86 ? C.sandK : y === G ? (r < 0.15 ? C.sandL : C.sand) : C.sandD
    }
  }
}

export function nesneCiz(t: Tuval, n: Nesne, cam: number, kare: number): void {
  const x = n.x - cam
  if (n.tip === 'sandik') sandik(t, x, G - 6)
  else if (n.tip === 'duvar') duvar(t, x, G - 8, 16, 8)
  else kapi(t, x, G - 8, kare)
}
