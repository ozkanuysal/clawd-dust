// Clawd Dust — araç çağrısından eylem ve balon metni. Saf.

export type Tur = 'tara' | 'yaz' | 'c4' | 'ajan' | 'smoke' | 'is'
export type Eylem = { tur: Tur; metin: string; grep?: boolean }

export const DUSUNUYOR = 'düşünüyor…'
export const GO = 'GO GO GO!'
export const HATA = 'Eyvah, hata! Düşman göründü'
export const SIPER = 'siperde, toparlanıyor'
export const AFIS = 'ROUND KAZANILDI · MVP: Clawd'
export const KONTROL = 'Kontrol sende!'

const OKUMA = new Set(['Read', 'NotebookRead'])
const ARAMA = new Set(['Grep', 'Glob'])
const YAZMA = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const AJAN = new Set(['Agent', 'Task'])
const AD_EN_UZUN = 28
const METIN_EN_UZUN = 40

// Raster hücresi tek genişlikte karakter ister: Latin + Türkçe dışını '?' yap
export function temizle(ham: unknown): string {
  const tek = String(ham ?? '').replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ').replace(/\s+/g, ' ').trim()
  return [...tek].map((c) => {
    const k = c.codePointAt(0) ?? 0
    return (k >= 0x20 && k <= 0x7e) || (k >= 0xa0 && k <= 0x24f) ? c : '?'
  }).join('')
}

export function kisalt(metin: string, n: number): string {
  const harfler = [...metin]
  return harfler.length <= n ? metin : harfler.slice(0, Math.max(1, n - 1)).join('') + '…'
}

const UNLU = 'aeıioöuü'
// Ünsüz harfin adındaki ünlü (be, ce… ama kü, dabılyu, iks); iks ünsüzle biter
const HARF_UNLU: Record<string, string> = { q: 'ü', w: 'u', x: 'i' }

function sonSes(ad: string): { unlu: string; unluyleBiter: boolean } {
  const kucuk = ad.toLocaleLowerCase('tr')
  const nokta = kucuk.lastIndexOf('.')
  const uzanti = nokta > 0 ? kucuk.slice(nokta + 1) : ''
  const unluler = [...(uzanti || kucuk)].filter((c) => UNLU.includes(c))
  const son = [...kucuk].pop() ?? 'e'
  if ((uzanti && uzanti.length <= 3) || unluler.length === 0) {
    if (UNLU.includes(son)) return { unlu: son, unluyleBiter: true }
    return { unlu: HARF_UNLU[son] ?? 'e', unluyleBiter: son !== 'x' }
  }
  return { unlu: unluler[unluler.length - 1] ?? 'e', unluyleBiter: UNLU.includes(son) }
}

// Belirtme (-ı/-i/-u/-ü) ve yönelme (-a/-e) ekleri, kesme işaretiyle
export function ekle(ad: string, hal: 'belirtme' | 'yonelme'): string {
  const { unlu, unluyleBiter } = sonSes(ad)
  const kalin = 'aıou'.includes(unlu)
  const yuvarlak = 'ouöü'.includes(unlu)
  const y = unluyleBiter ? 'y' : ''
  if (hal === 'yonelme') return `${ad}'${y}${kalin ? 'a' : 'e'}`
  return `${ad}'${y}${kalin ? (yuvarlak ? 'u' : 'ı') : (yuvarlak ? 'ü' : 'i')}`
}

function tabanAd(yol: unknown): string {
  const parca = temizle(yol).split(/[\\/]/).filter(Boolean)
  return kisalt(parca[parca.length - 1] || 'dosya', AD_EN_UZUN)
}

function komutAdi(komut: unknown): string {
  const parcalar = temizle(komut).split(/&&|\|\||;|\|/).map((p) => p.trim()).filter(Boolean)
  const asil = parcalar.find((p) => !/^cd\s/.test(p)) || parcalar[0] || 'komut'
  const [ilk = 'komut', ikinci = ''] = asil.split(' ').filter((k) => !/^\w+=/.test(k))
  const ad = ilk.split('/').pop() || 'komut'
  return kisalt(/^[a-z][\w:-]{0,11}$/i.test(ikinci) ? `${ad} ${ikinci}` : ad, AD_EN_UZUN)
}

function host(url: unknown): string {
  try {
    return temizle(new URL(String(url)).hostname.replace(/^www\./, ''))
  } catch {
    return ''
  }
}

export function eylemOku(e: { tool?: string; [k: string]: unknown }): Eylem {
  const arac = String(e?.tool ?? '')
  const k = (metin: string) => kisalt(metin, METIN_EN_UZUN)
  if (OKUMA.has(arac)) return { tur: 'tara', metin: k(`${ekle(tabanAd(e.file_path ?? e.notebook_path), 'belirtme')} tarıyor`) }
  if (ARAMA.has(arac)) {
    const eylem: Eylem = { tur: 'tara', metin: k(`"${kisalt(temizle(e.pattern), AD_EN_UZUN)}" arıyor`) }
    return arac === 'Grep' ? { ...eylem, grep: true } : eylem
  }
  if (YAZMA.has(arac)) return { tur: 'yaz', metin: k(`${ekle(tabanAd(e.file_path ?? e.notebook_path), 'yonelme')} yazıyor`) }
  if (arac === 'Bash') return { tur: 'c4', metin: k(`${komutAdi(e.command)} kuruyor`) }
  if (AJAN.has(arac)) return { tur: 'ajan', metin: k(`takım arkadaşı: ${temizle(e.description || e.subagent_type || 'yardım')}`) }
  if (arac === 'WebSearch') return { tur: 'smoke', metin: k(`smoke atıyor: ${temizle(e.query)}`) }
  if (arac === 'WebFetch') {
    const ad = host(e.url)
    return { tur: 'smoke', metin: k(ad ? `smoke atıyor: ${ad}` : 'smoke atıyor') }
  }
  const kisa = temizle(arac.replace(/^mcp__/, '').replace(/__/g, ' '))
  return { tur: 'is', metin: k(`${kisa || 'araç'} ile uğraşıyor`) }
}

export function para(n: number): string {
  return `$ ${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}
