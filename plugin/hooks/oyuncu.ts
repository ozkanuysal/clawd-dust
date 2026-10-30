// Clawd Dust — oyuncu kontrolü: 1–5 tuşları. Saf.

import { C } from './renk'
import { DUSUNUYOR, KONTROL } from './metin'
import { CLAWD_EN, DELIK_SAYISI, G, YAZI_DUVARI } from './sprite'
import { parcaSac } from './fizik'
import type { Komut, Sahne } from './sahne'

export const OYUNCU_SURE = 55 // ~5 sn, sonra Claude'un tepkilerine döner
const ZIPLAMA_HIZI = 2 // tepe ~3 piksel: bant 12 piksel
const ADIM_YURUME = 12
const ATES_MENZIL = 30
const ATES_KARE = 3
const BOMBA_UZAK = 40

function ates(s: Sahne): Sahne {
  const t = { ...s, ates: ATES_KARE }
  const on = s.x + CLAWD_EN
  const i = s.duvarlar.findIndex((d) => d.x <= on + ATES_MENZIL && d.x + YAZI_DUVARI.en >= on && d.delik < DELIK_SAYISI)
  if (i >= 0) return { ...t, duvarlar: s.duvarlar.map((d, j) => (j === i ? { ...d, delik: d.delik + 1 } : d)) }
  return { ...t, parca: parcaSac(s, on + ATES_MENZIL, G - 1, [C.sandL, C.sand, C.sandD], 6, 0.6) }
}

const KOMUTLAR: Record<Komut, (s: Sahne) => Sahne> = {
  zipla: (s) => (s.vy === 0 && s.zy <= 0 ? { ...s, vy: ZIPLAMA_HIZI } : s),
  sol: (s) => ({ ...s, yon: -1, yuruKalan: -ADIM_YURUME }),
  sag: (s) => ({ ...s, yon: 1, yuruKalan: ADIM_YURUME }),
  ates,
  bomba: (s) => (s.sis ? s : { ...s, sis: { x: Math.round(s.x) + BOMBA_UZAK, kare: -12 } }),
}

export function oyuncuOlayi(s: Sahne, k: Komut): Sahne {
  if (s.mod !== 'yuru') return s
  const temel: Sahne = { ...s, oyuncu: OYUNCU_SURE, balon: KONTROL, balonTur: 'altin', balonKare: s.kare, dusunAt: null }
  return KOMUTLAR[k](temel)
}

function yerCekimi(s: Sahne): Sahne {
  if (s.vy <= 0 && s.zy <= 0) return { ...s, zy: 0, vy: 0 }
  const zy = s.zy + s.vy
  return zy <= 0 ? { ...s, zy: 0, vy: 0 } : { ...s, zy, vy: s.vy - 1 }
}

export function oyuncuAdim(s: Sahne): Sahne {
  const d = Math.sign(s.yuruKalan) as -1 | 0 | 1
  const yuruyen = d === 0 ? s : { ...s, x: s.x + d, yon: d, yuruKalan: s.yuruKalan - d }
  const t = yerCekimi({ ...yuruyen, oyuncu: s.oyuncu - 1 })
  if (t.oyuncu > 0) return t
  return { ...t, yuruKalan: 0, yon: 1, balon: DUSUNUYOR, balonTur: 'varsayilan', balonKare: t.kare, dusunAt: null }
}
