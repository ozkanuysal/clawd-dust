// Clawd Dust — çizici: sahne durumu → Raster hücreleri. Saf.

import { C, h } from './renk'
import { type Tuval, type Palet, tuval, px, rect, disk, sprite, hucrele, metinYaz } from './tuval'
import { G, BANT_Y, CLAWD_EN, DELIKLER, DURBUN_LENS, YAZI_DUVARI, type Silah, type Ifade, clawd, arkadas, bot, namlu, sandik, duvar } from './sprite'
import { zemin, nesneler, nesneCiz } from './dunya'
import { sandiklar } from './fizik'
import { AFIS, GO } from './metin'
import { SMOKE_UCUS, type BalonTur, type Sahne } from './sahne'

const Y = BANT_Y
const BALON: Record<BalonTur, [number, number]> = {
  varsayilan: [0xf6e6c2, 0x2a2118], tehlike: [0xffe1da, 0x8a1c10], iyi: [0xdff5e6, 0x1f5a3c], altin: [0xffd23f, 0x2a2118],
}
const AFIS_RENK: [number, number] = [0xdff5e6, 0x1f5a3c]
const YAZI_X = 8 // CLAWD yazısının duvar içindeki başlangıcı
const YAZI_Y = G - 7

// ---- Parçalar ----
function agizAlevi(t: Tuval, m: { x: number; y: number }, yon: number): void {
  const p: [number, number, number][] = [[0, 0, C.white], [yon, 0, C.flash], [2 * yon, 0, C.fire], [yon, -1, C.flash], [yon, 1, C.flash]]
  p.forEach(([a, c, r]) => px(t, m.x + a, m.y + c, r))
}

function izMermisi(t: Tuval, a: { x: number; y: number }, b: { x: number; y: number }): void {
  for (let k = 0.15; k < 1; k += 0.12) px(t, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, C.tracer)
}

function yaziDuvari(t: Tuval, x: number, delik: number): void {
  duvar(t, x, G - YAZI_DUVARI.boy, YAZI_DUVARI.en, YAZI_DUVARI.boy)
  const acik = DELIKLER.slice(0, delik)
  acik.forEach(([dx, dy]) => { if (h(dx, dy) > 0.55) px(t, x + YAZI_X + dx + 1, YAZI_Y + dy - 1, C.stoneL) })
  acik.forEach(([dx, dy]) => px(t, x + YAZI_X + dx, YAZI_Y + dy, C.hole))
}

function c4Ciz(t: Tuval, s: Sahne, cam: number): void {
  if (!s.c4) return
  const x = s.c4.x - cam
  rect(t, x, G - 3, 5, 3, C.c4)
  rect(t, x + 1, G - 2, 3, 1, C.c4D)
  const k = s.kare
  const yanik = !s.c4.kuruldu ? (k >> 2) % 2 : s.c4.bitti ? k % 2 : (k >> 1) % 2
  px(t, x + 3, G - 3, yanik ? C.led : C.ledD)
}

function sisCiz(t: Tuval, s: Sahne, cam: number, elX: number): void {
  if (!s.sis) return
  const sx = s.sis.x - cam, k = s.sis.kare
  if (k < 0) {
    const a = Math.max(0, Math.min(1, 1 + k / SMOKE_UCUS))
    const gx = elX + (sx - elX) * a, gy = 3 + 4 * a - Math.sin(Math.PI * a) * 3
    px(t, gx, gy, C.c4)
    px(t, gx + 1, gy, C.smokeD)
    return
  }
  const g = Math.min(1, k / 16) * (k > 74 ? Math.max(0, 1 - (k - 74) / 16) : 1)
  const P: [number, number, number][] = [[0, 0, 4.5], [6, -1, 3.5], [-6, 0, 3.5], [3, -4, 3.5], [-3, -5, 3], [9, 1, 2.5], [-9, 1, 2.5]]
  const r = (i: number, rr: number) => rr * 0.65 * g + Math.sin((s.kare + i * 5) / 7) * 0.3
  P.forEach(([dx, dy, rr], i) => { if (r(i, rr) > 0.5) disk(t, sx + dx, G - 4 + dy * 0.6, r(i, rr) + 0.8, C.smokeD) })
  P.forEach(([dx, dy, rr], i) => { if (r(i, rr) > 0.5) disk(t, sx + dx, G - 4 + dy * 0.6, r(i, rr), C.smoke) })
  P.slice(0, 4).forEach(([dx, dy, rr]) => { if (rr * g > 2) disk(t, sx - 1 + dx, G - 5 + dy * 0.6, rr * g * 0.35, C.smokeL) })
}

function patlamaCiz(t: Tuval, s: Sahne, cam: number): void {
  if (!s.patlama) return
  const cx = s.patlama.x - cam, cy = G - 3, k = s.patlama.kare
  const r = 1.5 + k * 1.7
  for (let dy = -Math.ceil(r); dy <= r; dy++) for (let dx = -Math.ceil(r * 1.3); dx <= r * 1.3; dx++) {
    const d = Math.hypot(dx / 1.3, dy)
    if (d > r) continue
    px(t, cx + dx, cy + dy, d < r - 2.2 ? (k < 2 ? C.white : null) : d < r - 1 ? C.flash : C.fire)
  }
}

// 2x büyüten dürbün merceği; kilitliyken nişangah kırmızı
function mercek(t: Tuval, s: Sahne, cx: number): void {
  const hedef = Math.min(t.g - 9, cx + 70)
  const tara = cx + 50 + Math.sin(s.kare / 7) * 18
  const tx = Math.round(s.kilit > 0 ? tara + (hedef - tara) * Math.min(1, (34 - s.kilit) / 6) : tara)
  const ty = 5, r = 4, kopya = t.p.slice()
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    const d = Math.hypot(dx, dy)
    if (d <= r) {
      const sx = Math.max(0, Math.min(t.g - 1, Math.round(tx + dx / 2))), sy = Math.max(0, Math.min(Y - 1, Math.round(ty + dy / 2)))
      px(t, tx + dx, ty + dy, kopya[sy * t.g + sx])
    } else if (d <= r + 1) px(t, tx + dx, ty + dy, C.muzzle)
  }
  const kc = s.kilit > 0 ? C.red : C.muzzle
  for (let i = 2; i <= 4; i++) ([[i, 0], [-i, 0], [0, i], [0, -i]] as [number, number][]).forEach(([a, b]) => px(t, tx + a, ty + b, kc))
  if (s.kilit === 0 || s.kare % 4 < 2) px(t, tx, ty, kc)
}

// Satın alma paneli: keleş, yelek, bomba; alınan parlar
const DONUK: Palet = new Proxy({}, { get: (_, k) => (typeof k === 'string' && k !== '.' ? C.panelL : undefined) })
const URUNLER: { at: number; dx: number; en: number; rows: string[]; pal: Palet }[] = [
  { at: 4, dx: 2, en: 8, rows: ['....t..t', 'WWmmWWbk', '.W.pM...', '....M...'], pal: { t: C.muzzle, W: C.wood, m: C.metal, b: C.barrel, k: C.muzzle, p: C.woodD, M: C.bakalit } },
  { at: 11, dx: 11, en: 6, rows: ['V.VV.V', 'VVvvVV', 'VvVVvV', 'VVVVVV'], pal: { V: C.vest, v: C.vestD } },
  { at: 18, dx: 18, en: 3, rows: ['.p.', 'ggg', 'ggg', '.g.'], pal: { p: C.stud, g: C.c4 } },
]
function panel(t: Tuval, x: number, y: number, k: number): void {
  rect(t, x, y, 22, 8, C.panel)
  for (let i = 0; i < 22; i++) { px(t, x + i, y, C.panelL); px(t, x + i, y + 7, C.panelL) }
  for (let i = 0; i < 8; i++) { px(t, x, y + i, C.panelL); px(t, x + 21, y + i, C.panelL) }
  URUNLER.forEach((u) => {
    const alindi = k >= u.at
    if (k >= u.at && k < u.at + 2) rect(t, x + u.dx - 1, y + 1, u.en + 2, 6, C.panelL)
    sprite(t, u.rows, alindi ? u.pal : DONUK, x + u.dx, y + 2, 1)
    for (let i = 0; i < u.en; i++) px(t, x + u.dx + i, y + 6, alindi ? C.green : C.panelL)
  })
}

function yildizVeKonfeti(t: Tuval, s: Sahne, cx: number, y0: number): void {
  const renk = [C.star, C.red, C.teal, C.green, C.white]
  for (let i = 0; i < 30; i++) {
    const y = ((s.kare * (0.25 + h(i, 2) * 0.35) + h(i, 3) * 24) % 24) - 4
    if (y < G) px(t, h(i, 1) * t.g + Math.sin((s.kare + i * 7) / 6) * 1.5, y, renk[i % renk.length])
  }
  const sx = cx + 13, sy = y0 + 1 - ((s.kare >> 2) % 2)
  ;([[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]] as [number, number][]).forEach(([a, b]) => px(t, sx + a, sy + b, C.star))
  if (s.kare % 6 < 3) { px(t, sx - 2, sy, C.white); px(t, sx + 4, sy + 1, C.white) }
}

// ---- Clawd ve moduna göre süsleri ----
function clawdVeEylem(t: Tuval, s: Sahne, cam: number): { cx: number; y0: number } {
  const cx = Math.round(s.x - cam), m = s.modKare
  let silah: Silah = 'tufek', comel = false, yuru = false, vurul = false, sarjorYok = false, x = cx
  let ifade: Ifade = s.balon === GO ? 'mutlu' : s.ates > 0 ? 'kisik' : 'normal'
  if (s.mod === 'freeze') sarjorYok = m >= 24 && m < 31
  else if (s.mod === 'yuru') yuru = s.oyuncu === 0 || s.yuruKalan !== 0
  else if (s.mod === 'tara') { comel = true; silah = 'durbunlu'; ifade = 'kisik' }
  else if (s.mod === 'yaz') { x = cx - (s.kare % 2 === 0 ? 1 : 0); ifade = 'kisik' }
  else if (s.mod === 'c4') { comel = m < 44; silah = comel ? 'yok' : 'tufek'; yuru = m >= 44 && m < 72 }
  else if (s.mod === 'smoke') silah = s.sis && s.sis.kare < -SMOKE_UCUS + 6 ? 'bomba' : 'tufek'
  else if (s.mod === 'kac') { yuru = m >= 44 && m < 74; vurul = m >= 14 && m < 44 && m % 4 === 1; comel = m >= 74; silah = comel ? 'yok' : 'tufek'; ifade = comel ? 'kisik' : 'saskin' }
  else if (s.mod === 'bitti') { silah = 'havada'; ifade = 'mutlu' }
  const y0 = clawd(t, { x, zy: s.zy, yon: s.yon, kare: s.kare, yuru, comel, silah, vurul, sarjorYok, ifade })

  if (s.mod === 'freeze') {
    if (m >= 24) px(t, cx + 9, Math.min(G - 1, y0 + 7 + (m - 24) ** 2 * 0.3), C.bakalit)
    if (m < 30) panel(t, cx + 18, G - 8, m)
  }
  if (s.mod === 'tara' && s.kare % 10 < 2) px(t, cx + DURBUN_LENS.dx, y0 + DURBUN_LENS.dy, C.white)
  if (s.mod === 'c4' && m < 44 && s.c4) {
    const dolu = Math.floor((m / 44) * 11), bx = s.c4.x - cam - 3
    for (let i = 0; i < 11; i++) px(t, bx + i, G - 5, i < dolu ? C.green : C.bar)
  }
  const ates = (s.mod === 'yaz' && s.kare % 2 === 0) || s.ates > 0
  if (ates) agizAlevi(t, namlu(x, y0, s.yon), s.yon)
  if (s.mod === 'yaz') {
    const d = s.duvarlar[s.duvarlar.length - 1]
    if (d && s.kare % 2 === 1) {
      const [dx, dy] = DELIKLER[Math.max(0, d.delik - 1)] ?? [0, 0]
      izMermisi(t, namlu(x, y0, 1), { x: d.x - cam + YAZI_X + dx, y: YAZI_Y + dy })
    }
    for (let k = 0; k < Math.min(m, 24); k += 3) {
      let kx = cx + 10, ky = y0 + 5
      for (let i = 1; i <= m - k && ky < G - 1; i++) { kx += 0.7; ky = y0 + 5 - 1.1 * i + 0.22 * i * i }
      px(t, kx + h(k, 4) * 6, Math.min(G - 1, ky), C.brass)
    }
  }
  return { cx, y0 }
}

function dusmanCiz(t: Tuval, s: Sahne, cam: number, hedef: { cx: number; y0: number }): void {
  if (!s.dusman) return
  const m = s.modKare
  const bx = s.dusman.x - cam + (m < 14 ? 25 * (1 - m / 14) : 0)
  const agiz = bot(t, bx)
  if (s.mod === 'kac' && m >= 14 && m < 44 && m % 4 === 0) {
    agizAlevi(t, agiz, -1)
    izMermisi(t, agiz, { x: hedef.cx + CLAWD_EN, y: agiz.y })
  }
}

export function sahnePikselleri(s: Sahne, sutun: number): { t: Tuval; cam: number; cx: number } {
  const t = tuval(sutun, Y)
  const cam = Math.round(s.x - sutun * 0.32)
  zemin(t, cam)
  const dunya = nesneler(cam - 20, cam + sutun + 20)
  dunya.filter((n) => n.tip !== 'sandik').forEach((n) => nesneCiz(t, n, cam, s.kare))
  s.duvarlar.forEach((d) => yaziDuvari(t, d.x - cam, d.delik))
  sandiklar(s, cam - 20, cam + sutun + 20).forEach((x) => sandik(t, x - cam, G - 6))
  c4Ciz(t, s, cam)
  for (let i = 0; i < Math.min(2, s.arkadas); i++) {
    const ax = s.x - 16 * (i + 1)
    arkadas(t, { x: ax - cam, kare: s.kare + i * 3, yuru: s.mod === 'yuru' })
  }
  const c = clawdVeEylem(t, s, cam)
  dusmanCiz(t, s, cam, c)
  sisCiz(t, s, cam, c.cx + 10)
  patlamaCiz(t, s, cam)
  s.parca.forEach((p) => px(t, p.x - cam, p.y, p.renk))
  if (s.mod === 'tara') mercek(t, s, c.cx)
  if (s.mod === 'bitti') yildizVeKonfeti(t, s, c.cx, c.y0)
  return { t, cam, cx: c.cx }
}

export function sahneHucreleri(s: Sahne, sutun: number, satir: number): Uint32Array {
  const { t, cx } = sahnePikselleri(s, sutun)
  if (s.mod === 'bitti') {
    const hc = hucrele(t, sutun, satir)
    const metin = [...` ${AFIS} `].slice(0, sutun)
    metinYaz(hc, sutun, Math.max(0, Math.round((sutun - metin.length) / 2)), 0, metin.join(''), ...AFIS_RENK)
    return hc
  }
  const metin = [...` ${s.balon} `].slice(0, sutun)
  const merkez = cx + CLAWD_EN / 2
  const col = Math.max(0, Math.min(sutun - metin.length, Math.round(merkez - metin.length / 2)))
  const [fg, bg] = BALON[s.balonTur]
  const hc = hucrele(t, sutun, satir)
  if (s.balon) metinYaz(hc, sutun, col, 0, metin.join(''), fg, bg)
  return hc
}

