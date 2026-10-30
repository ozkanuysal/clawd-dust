// Clawd Dust — karakterler, silahlar ve harita parçaları. Saf.

import { C, h } from './renk'
import { type Tuval, type Palet, px, rect, sprite } from './tuval'

export const G = 10 // kumun ilk piksel satırı
export const BANT_Y = 12 // tasarım yüksekliği: 6 satır = 12 piksel
export const CLAWD_EN = 13

export type Silah = 'tufek' | 'durbunlu' | 'bomba' | 'havada' | 'yok'
type SilahCizimi = { ox: number; oy: number; uc: number; rows: string[]; pal: Palet }

export type Ifade = 'normal' | 'kisik' | 'saskin' | 'mutlu'

// Clawd: H kask, L parlak, h gölge/kenar, n kamuflaj ağı; A anten, R/r sırt çantası, E kulaklık;
// O gövde, P ışık, D gölge; V/v yelek, p cep. Gözler (sütun 6 ve 9) ifadeye göre çizilir.
const CLAWD = [
  'A..LLHHHh....',
  'A.LHnHHnHHh..',
  'A.hhhhhhhhhhh',
  'RREOPPPPPPP..',
  'RrDOOOOOOOO..',
  'RrDOOOOOOOO..',
  '.rDVvpVVpvV..',
]
const GOZ_X = [6, 9]
const CLAWD_PAL: Palet = {
  A: C.antenna, R: C.pack, r: C.packD, E: C.ear,
  H: C.helm, L: C.helmL, h: C.helmD, n: C.helmN,
  O: C.o, P: C.oL, D: C.oD, V: C.vest, v: C.vestD, p: C.pouch, S: C.boot,
}
const VURUL_PAL: Palet = { ...CLAWD_PAL, O: C.white, P: C.white, D: 0xf0c8b8 }
const BACAK = ['..SS..SS.....', '...SS.SS.....']

// [satır, piksel] çiftleri: B kaş, K göz, W göz parıltısı, O kapalı göz
const IFADE: Record<Ifade, [number, string][]> = {
  normal: [[3, 'B'], [4, 'W'], [5, 'K']],
  kisik: [[4, 'B'], [5, 'K']],
  saskin: [[4, 'K'], [5, 'K']],
  mutlu: [[4, 'K']],
}
const KIRPMA: [number, string][] = [[3, 'B'], [5, 'B']]
const YUZ_PAL: Palet = { B: C.brow, K: C.eye, W: C.white }

// Keleş: W ahşap, w açık ahşap, M bakalit şarjör, m gövde, b namlu, k ağız, t gez/arpacık; G eldiven (kabza ve kundak)
const SIL_PAL: Palet = { t: C.muzzle, W: C.wood, w: C.woodL, p: C.woodD, M: C.bakalit, m: C.metal, b: C.barrel, k: C.muzzle, g: C.metal, G: C.glove }
export const TUFEK: SilahCizimi = { ox: 4, oy: 5, uc: 12, rows: ['......t.www.t', 'WWWmmmmWWWbbk', '.WW.GMM.G....'], pal: SIL_PAL }
const DURBUNLU: SilahCizimi = {
  ox: 3, oy: 5, uc: 18,
  rows: ['....sSSSSl.........', 'TTTTmmmmmmmbbbbbbbk', '.TT..g..m..........'],
  pal: { s: C.metal, S: C.metalL, l: C.lens, T: C.tan, m: C.metal, b: C.barrel, k: C.muzzle, g: C.metal },
}
const SMG: SilahCizimi = { ox: 3, oy: 5, uc: 8, rows: ['...t.....', 'WmmmmmMbk', '..G.m.G..'], pal: { ...SIL_PAL, M: C.metalL } }
const BOMBA: SilahCizimi = { ox: 10, oy: 4, uc: 1, rows: ['.p', 'gg', 'gG'], pal: { p: C.stud, g: C.c4, G: C.glove } }
const BOT_TUFEK: SilahCizimi = { ...TUFEK, ox: 3, oy: 3, rows: TUFEK.rows.map((r) => r.replace(/G/g, '.')), pal: { ...SIL_PAL, W: C.botD, w: C.bot, p: C.botD } }
const SILAHLAR: Partial<Record<Silah, SilahCizimi>> = { tufek: TUFEK, durbunlu: DURBUNLU, bomba: BOMBA }
export const DURBUN_LENS = { dx: DURBUNLU.ox + 9, dy: DURBUNLU.oy } // dürbün camının Clawd'a göre yeri

function silahCiz(t: Tuval, sil: SilahCizimi, x: number, y0: number, en: number, yon: 1 | -1, atla?: (ch: string) => boolean): void {
  sil.rows.forEach((s, dy) => [...s].forEach((ch, dx) => {
    const c = sil.pal[ch]
    if (c === undefined || atla?.(ch)) return
    const rx = sil.ox + dx
    px(t, yon > 0 ? x + rx : x + en - 1 - rx, y0 + sil.oy + dy, c)
  }))
}

// Namlu yukarı: kabzadan döndürülmüş keleş
function silahDik(t: Tuval, sil: SilahCizimi, x: number, y0: number): void {
  sil.rows.forEach((s, dy) => [...s].forEach((ch, dx) => {
    const c = sil.pal[ch]
    if (c !== undefined) px(t, x + 8 + (dy - 2), y0 + 7 - (dx - 4), c)
  }))
}

function namluAgzi(x: number, y0: number, yon: 1 | -1, sil: SilahCizimi, en: number) {
  const rx = sil.ox + sil.uc + 1
  return { x: yon > 0 ? x + rx : x + en - 1 - rx, y: y0 + sil.oy + 1 }
}

export function namlu(x: number, y0: number, yon: 1 | -1): { x: number; y: number } {
  return namluAgzi(x, y0, yon, TUFEK, CLAWD_EN)
}

export type ClawdCiz = {
  x: number; zy?: number; yon?: 1 | -1; kare?: number; yuru?: boolean; comel?: boolean
  silah?: Silah; vurul?: boolean; sarjorYok?: boolean; ifade?: Ifade
}

export function clawd(t: Tuval, o: ClawdCiz): number {
  const { zy = 0, yon = 1, kare = 0, yuru = false, comel = false, silah = 'tufek', vurul = false, sarjorYok = false, ifade = 'normal' } = o
  const x = Math.round(o.x)
  const y0 = G - 8 - Math.round(zy) + (comel ? 1 : 0)
  // Yere düşen gölge: zıplayınca daralır
  const golge = Math.max(2, 8 - Math.round(zy) * 2)
  for (let i = 0; i < golge; i++) px(t, x + 6 - golge / 2 + i, G, C.sandK)
  sprite(t, CLAWD, vurul ? VURUL_PAL : CLAWD_PAL, x, y0, yon)
  const yuz = ifade === 'normal' && kare % 47 === 0 ? KIRPMA : IFADE[ifade]
  for (const [dy, ch] of yuz) for (const gx of GOZ_X) px(t, yon > 0 ? x + gx : x + CLAWD_EN - 1 - gx, y0 + dy, YUZ_PAL[ch])
  if (!comel) sprite(t, [BACAK[yuru ? (kare >> 1) % 2 : 0] ?? ''], CLAWD_PAL, x, y0 + 7, yon)
  if (silah === 'havada') silahDik(t, TUFEK, x, y0)
  else {
    const sil = SILAHLAR[silah]
    if (sil) silahCiz(t, sil, x, y0, CLAWD_EN, yon, sarjorYok ? (ch) => ch === 'M' : undefined)
  }
  return y0
}

// Takım arkadaşı: kum rengi kask, alnında gözlük, kısa namlulu silah
const ARKADAS = [
  '..LMMMMm..',
  '.MbGGbGGb.',
  'mmmmmmmmmm',
  '.DPPPPPPP.',
  '.DOOWOOWO.',
  'DDOOKOOKO.',
  '.VVvpVvVV.',
]
const ARKADAS_PAL: Palet = {
  L: C.tanL, M: C.tan, m: C.tanD, b: C.metal, G: C.lens, O: C.oL, P: 0xf3b08e, D: C.o, K: C.eye, W: C.white,
  V: C.vest, v: C.vestD, p: C.pouch, S: C.boot,
}
const ARKADAS_BACAK = ['.SS..SS...', '..SS.SS...']

export function arkadas(t: Tuval, o: { x: number; zy?: number; kare?: number; yuru?: boolean }): void {
  const { zy = 0, kare = 0, yuru = false } = o
  const x = Math.round(o.x)
  const y0 = G - 8 - Math.round(zy)
  sprite(t, ARKADAS, ARKADAS_PAL, x, y0, 1)
  sprite(t, [ARKADAS_BACAK[yuru ? ((kare >> 1) + 1) % 2 : 0] ?? ''], ARKADAS_PAL, x, y0 + 7, 1)
  if (kare % 16 < 2) px(t, x + 3, y0 + 1, C.white)
  silahCiz(t, SMG, x, y0, 10, 1)
}

const BOT = ['.GGGGGG.', 'GGGGGGGG', 'VVVVVGGG', 'GGGGGGGG', 'gGGGGGGg', '.gGGGGg.']
const BOT_PAL: Palet = { G: C.bot, g: C.botD, V: C.visor }

// Sola bakan bot; namlu ağzını döndürür
export function bot(t: Tuval, xx: number): { x: number; y: number } {
  const x = Math.round(xx)
  const y0 = G - 7
  sprite(t, BOT, BOT_PAL, x, y0, 1)
  sprite(t, ['.g.gg.g.'], BOT_PAL, x, y0 + 6, 1)
  silahCiz(t, BOT_TUFEK, x, y0, 8, -1)
  return namluAgzi(x, y0, -1, BOT_TUFEK, 8)
}

// Duvara mermiyle yazılan CLAWD: 3x5 harfler, harf arası 5; harf harf, yukarıdan aşağı sıralı
const HARF: Record<string, string[]> = {
  C: ['###', '#..', '#..', '#..', '###'], L: ['#..', '#..', '#..', '#..', '###'], A: ['.#.', '#.#', '###', '#.#', '#.#'],
  W: ['#.#', '#.#', '#.#', '###', '#.#'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
}
export const DELIKLER: [number, number][] = [...'CLAWD'].flatMap((ch, i) =>
  (HARF[ch] ?? []).flatMap((s, dy) => [...s].map((c, dx) => (c === '#' ? [[i * 5 + dx, dy] as [number, number]] : [])).flat()),
).sort((a, b) => Math.floor(a[0] / 5) - Math.floor(b[0] / 5) || a[1] - b[1] || a[0] - b[0])
export const DELIK_SAYISI = DELIKLER.length
export const YAZI_DUVARI = { en: 40, boy: 8 }

// ---- Harita parçaları ----
export function sandik(t: Tuval, x: number, y: number, s = 6): void {
  for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) {
    const kenar = dx === 0 || dy === 0 || dx === s - 1 || dy === s - 1
    const capraz = dx === dy || dx === s - 1 - dy
    px(t, x + dx, y + dy, kenar || capraz ? C.crateD : dy === 1 ? C.crateL : C.crate)
  }
}

export function duvar(t: Tuval, x: number, y: number, w: number, hh: number): void {
  for (let dy = 0; dy < hh; dy++) for (let dx = 0; dx < w; dx++) {
    const harc = dy % 3 === 2 || (dx + (Math.floor(dy / 3) % 2) * 3) % 6 === 0
    px(t, x + dx, y + dy, dy === 0 ? C.stoneL : harc ? C.stoneD : C.stone)
  }
}

// Kemerli taş kapı: çift kanat, boyası dökülmüş, demir kuşaklı, sağ kanat aralık; yanında fener
export const KAPI_EN = 13
export function kapi(t: Tuval, x: number, y: number, kare: number): void {
  const hh = G - y
  for (let dy = 0; dy < hh; dy++) for (let dx = 0; dx < KAPI_EN; dx++) {
    if (dy === 0 && (dx < 3 || dx > KAPI_EN - 4)) continue
    if (dy === 1 && (dx < 1 || dx > KAPI_EN - 2)) continue
    const harc = (dy + dx * 2) % 5 === 0
    px(t, x + dx, y + dy, dy <= 1 ? C.stoneL : harc ? C.stoneD : C.stone)
  }
  for (let dx = 3; dx <= KAPI_EN - 4; dx++) px(t, x + dx, y + 2, C.panel)
  for (let dx = 2; dx <= KAPI_EN - 3; dx++) px(t, x + dx, y + 3, dx % 2 ? C.panelL : C.panel)
  const ust = y + 4, alt = G - 1, orta = Math.round((ust + alt) / 2)
  for (let yy = ust; yy <= alt; yy++) for (let dx = 2; dx <= KAPI_EN - 3; dx++) {
    let c = dx % 2 === 0 ? C.tealD : C.teal
    if (dx === 2 || dx === 7) c = C.tealL
    if (h(x + dx, yy * 3) > 0.84) c = C.woodL
    if (yy === ust + 1 || yy === alt - 1) c = dx % 2 === 0 ? C.stud : C.iron
    if (dx === KAPI_EN - 3) c = C.gap
    if (dx === KAPI_EN - 4 && c !== C.stud && c !== C.iron) c = C.tealD
    px(t, x + dx, yy, c)
  }
  px(t, x + 6, orta, C.lamp)
  px(t, x + 7, orta, C.lamp)
  px(t, x + 6, orta + 1, C.brass)
  rect(t, x + 1, G - 1, KAPI_EN - 2, 1, C.stoneD)
  const fx = x + KAPI_EN + 1
  px(t, fx, y + 2, C.iron)
  px(t, fx, y + 3, C.iron)
  px(t, fx, y + 4, C.metal)
  px(t, fx, y + 5, kare % 14 < 11 ? C.lamp : C.brass)
  px(t, fx, y + 6, C.metal)
}
