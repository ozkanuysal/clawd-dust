// Clawd Dust — piksel tuvali ve Raster hücreleri (▀ yarım blok: üst piksel fg, alt piksel bg). Saf.

import { BOS } from './renk'

export type Tuval = { g: number; y: number; p: Uint32Array }
export type Palet = Record<string, number | undefined>

const UST_YARIM = 0x2580 // ▀
const ALT_YARIM = 0x2584 // ▄
const BOSLUK = 0x20

export function tuval(g: number, y: number): Tuval {
  return { g, y, p: new Uint32Array(g * y).fill(BOS) }
}

export function px(t: Tuval, x: number, y: number, c?: number | null): void {
  const xi = Math.round(x), yi = Math.round(y)
  if (c != null && xi >= 0 && xi < t.g && yi >= 0 && yi < t.y) t.p[yi * t.g + xi] = c
}

export function rect(t: Tuval, x: number, y: number, w: number, h: number, c: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) px(t, x + dx, y + dy, c)
}

// Terminal hücresi yatayda dar: daire 1.3 kat geniş çizilir
export function disk(t: Tuval, cx: number, cy: number, r: number, c: number): void {
  for (let dy = -Math.ceil(r); dy <= r; dy++) for (let dx = -Math.ceil(r * 1.3); dx <= r * 1.3; dx++)
    if (Math.hypot(dx / 1.3, dy) <= r) px(t, cx + dx, cy + dy, c)
}

export function sprite(t: Tuval, satirlar: string[], pal: Palet, x: number, y: number, yon: 1 | -1): void {
  const g = satirlar[0]?.length ?? 0
  satirlar.forEach((s, dy) => [...s].forEach((ch, dx) => {
    const c = pal[ch]
    if (c !== undefined) px(t, x + (yon < 0 ? g - 1 - dx : dx), y + dy, c)
  }))
}

function hucreYaz(hc: Uint32Array, i: number, cp: number, fg: number, bg: number): void {
  hc[i * 3] = cp
  hc[i * 3 + 1] = fg
  hc[i * 3 + 2] = bg
}

// Tuvalin alttaki satir*2 pikseli çizilir: kısa bantta üst kırpılır
export function hucrele(t: Tuval, sutun: number, satir: number): Uint32Array {
  const hc = new Uint32Array(sutun * satir * 3)
  const oy = t.y - satir * 2
  for (let r = 0; r < satir; r++) {
    for (let c = 0; c < sutun; c++) {
      const ust = t.p[(oy + 2 * r) * t.g + c] ?? BOS, alt = t.p[(oy + 2 * r + 1) * t.g + c] ?? BOS
      const i = r * sutun + c
      if (ust === BOS && alt === BOS) hucreYaz(hc, i, BOSLUK, BOS, BOS)
      else if (ust === BOS) hucreYaz(hc, i, ALT_YARIM, alt, BOS)
      else hucreYaz(hc, i, UST_YARIM, ust, alt)
    }
  }
  return hc
}

export function metinYaz(hc: Uint32Array, sutun: number, col: number, row: number, metin: string, fg: number, bg: number): void {
  const satir = hc.length / 3 / sutun
  if (row < 0 || row >= satir) return
  ;[...metin].forEach((ch, i) => {
    const c = col + i
    if (c >= 0 && c < sutun) hucreYaz(hc, row * sutun + c, ch.codePointAt(0) ?? BOSLUK, fg, bg)
  })
}

export function base64(hc: Uint32Array): string {
  const bayt = new Uint8Array(hc.buffer, hc.byteOffset, hc.byteLength) as Uint8Array & { toBase64?: () => string }
  if (typeof bayt.toBase64 === 'function') return bayt.toBase64()
  let ikili = ''
  for (let i = 0; i < bayt.length; i += 0x8000) ikili += String.fromCharCode(...bayt.subarray(i, i + 0x8000))
  return btoa(ikili)
}
