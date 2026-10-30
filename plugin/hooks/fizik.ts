// Clawd Dust — ortak fizik: parçacıklar, dünya sandıkları, atlama yayı. Saf.

import { h } from './renk'
import { nesneler } from './dunya'
import { BANT_Y } from './sprite'
import type { Parca, Sahne } from './sahne'

const EN_COK_PARCA = 80

export function parcaSac(s: Sahne, cx: number, cy: number, renkler: number[], adet: number, guc: number): Parca[] {
  const yeni = Array.from({ length: adet }, (_, i) => {
    const r1 = h(s.kare * 31 + i, cx), r2 = h(s.kare * 17 + i, cy + 5)
    return { x: cx + (r1 - 0.5) * 3, y: cy, vx: (r1 - 0.5) * 2.4 * guc, vy: -(0.6 + r2 * 1.8) * guc, renk: renkler[i % renkler.length] ?? 0, omur: 7 + Math.floor(r2 * 8) }
  })
  return [...s.parca, ...yeni].slice(-EN_COK_PARCA)
}

export function parcaAdim(parca: Parca[]): Parca[] {
  return parca
    .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.35, omur: p.omur - 1 }))
    .filter((p) => p.omur > 0 && p.y < BANT_Y)
}

// C4'ün uçurmadığı dünya sandıkları
export function sandiklar(s: Sahne, bas: number, bit: number): number[] {
  return nesneler(bas, bit).filter((n) => n.tip === 'sandik' && !s.kirik.includes(n.x)).map((n) => n.x)
}
