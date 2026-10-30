// Clawd Dust — sahne durum makinesi. Saf: durum + olay → yeni durum; kare başına adim().

import { C } from './renk'
import { type Eylem, DUSUNUYOR, GO, HATA, SIPER, para as paraYaz } from './metin'
import { parcaSac, parcaAdim, sandiklar } from './fizik'
import { oyuncuOlayi, oyuncuAdim } from './oyuncu'
import { DELIK_SAYISI, G } from './sprite'

export type Komut = 'zipla' | 'sol' | 'sag' | 'ates' | 'bomba'
export type Mod = 'freeze' | 'yuru' | 'tara' | 'yaz' | 'c4' | 'smoke' | 'kac' | 'bitti'
export type BalonTur = 'varsayilan' | 'tehlike' | 'iyi' | 'altin'
export type Olay =
  | { tip: 'basla' }
  | { tip: 'eylem'; eylem: Eylem }
  | { tip: 'eylemBitti'; hata: boolean }
  | { tip: 'ajanBitti' }
  | { tip: 'bitti' }
  | { tip: 'oyuncu'; komut: Komut }
export type Parca = { x: number; y: number; vx: number; vy: number; renk: number; omur: number }
type Bekleyen = { eylem: Eylem; bitti: boolean }

export type Sahne = {
  kare: number; x: number; zy: number; vy: number; yon: 1 | -1
  mod: Mod; modKare: number
  balon: string; balonTur: BalonTur; balonKare: number; dusunAt: number | null
  para: number; can: number; arkadas: number; kilit: number; grep: boolean
  duvarlar: { x: number; delik: number }[]
  kirik: number[] // C4'ün uçurduğu dünya sandıkları
  c4: { x: number; ad: string; kuruldu: boolean; bitti: boolean } | null
  sis: { x: number; kare: number } | null // kare < 0: bomba havada
  dusman: { x: number } | null
  patlama: { x: number; kare: number } | null
  parca: Parca[]
  oyuncu: number; yuruKalan: number; ates: number
  bekleyen: Bekleyen | null
}

export const PARA_BAS = 800
const ARAC_PARA = 300
const ROUND_PARA = 3250
const PARA_TAVAN = 16000
export const FREEZE_KARE = 36
const GO_KARE = 24
const GO_SONRA_EYLEM = 12 // freeze'de bekleyen araç GO'dan bu kadar sonra oynar
const BALON_EN_AZ = 22
const KILIT_KARE = 34
const DUVAR_UZAK = 26
const EN_COK_DUVAR = 4
const C4_UZAK = 14
const C4_KURULUM = 44
const C4_GERI_BITIS = 72
const C4_PATLAMA_EN_ERKEN = 60
export const SMOKE_UCUS = 22
const SMOKE_UZAK = 64
const SIS_OMUR = 90
const KAC_GIRIS = 14
const KAC_ATES_BITIS = 44
const KAC_KACIS_BITIS = 74
const KAC_BITIS = 94
const DUSMAN_UZAK = 60
const EN_COK_KIRIK = 8

export function yeniSahne(para = PARA_BAS): Sahne {
  return {
    kare: 0, x: 0, zy: 0, vy: 0, yon: 1, mod: 'yuru', modKare: 0,
    balon: DUSUNUYOR, balonTur: 'varsayilan', balonKare: -BALON_EN_AZ, dusunAt: null,
    para, can: 10, arkadas: 0, kilit: 0, grep: false,
    duvarlar: [], kirik: [], c4: null, sis: null, dusman: null, patlama: null, parca: [],
    oyuncu: 0, yuruKalan: 0, ates: 0, bekleyen: null,
  }
}

const sinirla = (n: number) => Math.max(0, Math.min(PARA_TAVAN, n))

// ---- Olaylar ----
function balonla(s: Sahne, balon: string, balonTur: BalonTur = 'varsayilan'): Sahne {
  return { ...s, balon, balonTur, balonKare: s.kare, dusunAt: null }
}

function patlat(s: Sahne): Sahne {
  if (!s.c4) return s
  const { x } = s.c4
  const ucan = sandiklar(s, x - 12, x + 13)
  const sicak = [C.white, C.flash, C.fire, C.sandD, C.crate, C.crateD]
  return {
    ...s, c4: null, patlama: { x: x + 2, kare: 0 },
    parca: parcaSac(s, x + 2, G - 2, sicak, 34, 1.4),
    kirik: [...s.kirik, ...ucan].slice(-EN_COK_KIRIK),
  }
}

// Süren sahneyi bitirir: kurulu C4 patlar, kurulmamışı geri alınır
function sahneyiBitir(s: Sahne): Sahne {
  if (s.c4?.kuruldu) return patlat(s)
  return { ...s, c4: null }
}

function eylemBaslat(s: Sahne, e: Eylem): Sahne {
  const t = { ...balonla(sahneyiBitir(s), e.metin), grep: !!e.grep, kilit: 0, oyuncu: 0, yuruKalan: 0, yon: 1 as const, modKare: 0 }
  const x = Math.round(s.x)
  if (e.tur === 'tara') return { ...t, mod: 'tara' }
  if (e.tur === 'yaz') return { ...t, mod: 'yaz', duvarlar: [...t.duvarlar, { x: x + DUVAR_UZAK, delik: 0 }].slice(-EN_COK_DUVAR) }
  if (e.tur === 'c4') return { ...t, mod: 'c4', c4: { x: x + C4_UZAK, ad: e.metin.replace(/ kuruyor$/, ''), kuruldu: false, bitti: false } }
  if (e.tur === 'smoke') return { ...t, mod: 'smoke', sis: { x: x + SMOKE_UZAK, kare: -SMOKE_UCUS } }
  if (e.tur === 'ajan') return { ...t, mod: 'yuru', arkadas: s.arkadas + 1 }
  return { ...t, mod: 'yuru' }
}

function hataBaslat(s: Sahne): Sahne {
  const t = sahneyiBitir(s)
  return {
    ...balonla(t, HATA, 'tehlike'), para: sinirla(s.para - ARAC_PARA),
    mod: 'kac', modKare: 0, yon: 1, oyuncu: 0, yuruKalan: 0, bekleyen: null, dusman: { x: Math.round(s.x) + DUSMAN_UZAK },
  }
}

function basariliBitti(s: Sahne): Sahne {
  const t = { ...s, para: sinirla(s.para + ARAC_PARA), dusunAt: s.balonKare + BALON_EN_AZ }
  if (t.mod === 'c4' && t.c4) return { ...t, c4: { ...t.c4, bitti: true } }
  if (t.mod === 'tara') {
    if (!t.grep) return { ...t, mod: 'yuru', modKare: 0 }
    return { ...balonla(t, t.balon.replace(/ arıyor$/, ' tarandı'), 'iyi'), kilit: KILIT_KARE, dusunAt: t.kare + KILIT_KARE }
  }
  return t
}

export function olayUygula(s: Sahne, o: Olay): Sahne {
  if (o.tip === 'basla') {
    return {
      ...balonla(s, '0:03 · satın alıyor', 'altin'), mod: 'freeze', modKare: 0, yon: 1, zy: 0, vy: 0,
      can: 10, arkadas: 0, kilit: 0, c4: null, sis: null, dusman: null, oyuncu: 0, yuruKalan: 0, bekleyen: null,
    }
  }
  if (s.mod === 'bitti') return s
  if (o.tip === 'bitti') {
    return { ...balonla(sahneyiBitir(s), '', 'iyi'), mod: 'bitti', modKare: 0, yon: 1, dusman: null, oyuncu: 0, para: sinirla(s.para + ROUND_PARA) }
  }
  if (o.tip === 'ajanBitti') return { ...s, arkadas: Math.max(0, s.arkadas - 1) }
  if (o.tip === 'oyuncu') return oyuncuOlayi(s, o.komut)
  if (s.mod === 'freeze') {
    if (o.tip === 'eylem') return { ...s, bekleyen: { eylem: o.eylem, bitti: false } }
    const para = sinirla(s.para + (o.hata ? -ARAC_PARA : ARAC_PARA))
    return { ...s, para, bekleyen: s.bekleyen && !o.hata ? { ...s.bekleyen, bitti: true } : null }
  }
  if (o.tip === 'eylem') {
    if (s.mod === 'kac') return s
    return balonTaze(s) ? { ...s, bekleyen: { eylem: o.eylem, bitti: false } } : eylemBaslat(s, o.eylem)
  }
  if (o.hata) return hataBaslat(s)
  if (s.bekleyen) return { ...s, para: sinirla(s.para + ARAC_PARA), bekleyen: { ...s.bekleyen, bitti: true } }
  return basariliBitti(s)
}

// ---- Kare adımları ----
function freezeAdim(s: Sahne): Sahne {
  if (s.modKare >= FREEZE_KARE) return { ...balonla(s, GO, 'altin'), mod: 'yuru', modKare: 0, dusunAt: s.kare + GO_KARE }
  const sn = 3 - Math.floor(s.modKare / 12)
  return { ...s, balon: `0:0${sn} · ${s.modKare < 22 ? 'satın alıyor' : 'şarjör takıyor'}` }
}

function yuruAdim(s: Sahne): Sahne {
  const x = s.x + 1
  return { ...s, x, yon: 1, zy: 0 }
}

function taraAdim(s: Sahne): Sahne {
  return s.grep && s.kilit === 0 && s.balonTur === 'iyi' ? { ...s, mod: 'yuru', modKare: 0 } : s
}

function yazAdim(s: Sahne): Sahne {
  const son = s.duvarlar[s.duvarlar.length - 1]
  if (!son) return { ...s, mod: 'yuru' }
  const delik = Math.min(DELIK_SAYISI, son.delik + 1)
  const duvarlar = [...s.duvarlar.slice(0, -1), { ...son, delik }]
  return { ...s, duvarlar, mod: delik >= DELIK_SAYISI ? 'yuru' : 'yaz' }
}

function c4Adim(s: Sahne): Sahne {
  if (!s.c4) return { ...s, mod: 'yuru' }
  const kuruldu = s.modKare >= C4_KURULUM
  const geri = kuruldu && s.modKare < C4_GERI_BITIS
  const t: Sahne = { ...s, c4: { ...s.c4, kuruldu }, x: geri ? s.x - 0.8 : s.x, yon: kuruldu ? -1 : 1 }
  if (!(kuruldu && s.c4.bitti && s.modKare >= C4_PATLAMA_EN_ERKEN)) return t
  const bitti = `${s.c4.ad} bitti · +${paraYaz(ARAC_PARA).replace(' ', '')}`
  return { ...balonla(patlat(t), bitti, 'iyi'), mod: 'yuru', modKare: 0, yon: 1, dusunAt: t.kare + BALON_EN_AZ }
}

function smokeAdim(s: Sahne): Sahne {
  return s.sis && s.sis.kare >= 0 ? { ...s, mod: 'yuru', modKare: 0 } : s
}

function kacAdim(s: Sahne): Sahne {
  const k = s.modKare
  if (k >= KAC_BITIS) return { ...balonla(s, DUSUNUYOR), mod: 'yuru', modKare: 0, can: 10, dusman: null, yon: 1 }
  if (k >= KAC_KACIS_BITIS) return k === KAC_KACIS_BITIS ? balonla(s, SIPER, 'tehlike') : s
  if (k >= KAC_ATES_BITIS) return { ...s, x: s.x - 1.34, yon: -1 }
  if (k >= KAC_GIRIS && k % 4 === 0) {
    const can = Math.max(3, s.can - 1)
    return { ...s, can, balon: `${HATA} · can ${can}` }
  }
  return s
}

const MOD_ADIMI: Record<Mod, (s: Sahne) => Sahne> = {
  freeze: freezeAdim, yuru: yuruAdim, tara: taraAdim, yaz: yazAdim, c4: c4Adim, smoke: smokeAdim, kac: kacAdim, bitti: (s) => s,
}

function balonZamani(s: Sahne): Sahne {
  if (s.dusunAt === null || s.kare < s.dusunAt || s.mod !== 'yuru' || s.oyuncu > 0) return s
  return { ...balonla(s, DUSUNUYOR), dusunAt: null }
}

// Araç balonu en az BALON_EN_AZ kare (GO balonu GO_SONRA_EYLEM kare) ekranda kalır; o sürede gelen araç bekler
function balonTaze(s: Sahne): boolean {
  if (s.balon === DUSUNUYOR) return false
  return s.kare < s.balonKare + (s.balon === GO ? GO_SONRA_EYLEM : BALON_EN_AZ)
}

function bekleyeniBaslat(s: Sahne): Sahne {
  if (!s.bekleyen || s.mod === 'freeze' || s.mod === 'kac' || s.mod === 'bitti' || balonTaze(s)) return s
  const { eylem, bitti } = s.bekleyen
  const t = eylemBaslat({ ...s, bekleyen: null }, eylem)
  return bitti ? basariliBitti(t) : t
}

export function adim(s: Sahne): Sahne {
  const t: Sahne = {
    ...s, kare: s.kare + 1, modKare: s.modKare + 1, parca: parcaAdim(s.parca),
    patlama: s.patlama && s.patlama.kare < 8 ? { ...s.patlama, kare: s.patlama.kare + 1 } : null,
    sis: s.sis && s.sis.kare < SIS_OMUR ? { ...s.sis, kare: s.sis.kare + 1 } : null,
    kilit: Math.max(0, s.kilit - 1), ates: Math.max(0, s.ates - 1),
  }
  const sonraki = s.oyuncu > 0 && s.mod === 'yuru' ? oyuncuAdim(t) : MOD_ADIMI[s.mod](t)
  return bekleyeniBaslat(balonZamani(sonraki))
}
