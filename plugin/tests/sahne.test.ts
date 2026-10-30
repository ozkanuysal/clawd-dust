import { expect, test } from 'claude-code/testing'
import { h } from '../hooks/renk'
import { eylemOku, GO } from '../hooks/metin'
import { DELIK_SAYISI } from '../hooks/sprite'
import { yeniSahne, olayUygula, adim, type Sahne, type Olay } from '../hooks/sahne'

const ilerle = (s: Sahne, n: number) => {
  for (let i = 0; i < n; i++) s = adim(s)
  return s
}
const eylem = (s: Sahne, e: { tool: string; [k: string]: unknown }) => olayUygula(s, { tip: 'eylem', eylem: eylemOku(e) })

test('basla freeze ile başlar ve 36 karede yürümeye geçer', () => {
  let s = olayUygula(yeniSahne(), { tip: 'basla' })
  expect(s.mod).toBe('freeze')
  s = ilerle(s, 36)
  expect(s.mod).toBe('yuru')
  expect(s.balon).toBe(GO)
})

test('yaz tüm deliklerde biter', () => {
  let s = eylem(yeniSahne(), { tool: 'Edit', file_path: '/a/b.ts' })
  expect(s.mod).toBe('yaz')
  s = ilerle(s, DELIK_SAYISI + 1)
  expect(s.duvarlar[0]!.delik).toBe(DELIK_SAYISI)
  expect(s.mod).toBe('yuru')
})

test('c4 bitmeden patlamaz', () => {
  let s = ilerle(eylem(yeniSahne(), { tool: 'Bash', command: 'npm test' }), 100)
  expect(s.c4?.kuruldu).toBe(true)
  expect(s.patlama).toBe(null)
  s = adim(olayUygula(s, { tip: 'eylemBitti', hata: false }))
  expect(s.patlama).not.toBe(null)
  expect(s.c4).toBe(null)
})

test('hata para düşürür ama sıfırın altına inmez', () => {
  const s = olayUygula(yeniSahne(100), { tip: 'eylemBitti', hata: true })
  expect(s.para).toBe(0)
  expect(s.mod).toBe('kac')
})

test('başarılı araç para kazandırır, tur sonu tavanı aşmaz', () => {
  expect(olayUygula(yeniSahne(), { tip: 'eylemBitti', hata: false }).para).toBe(1100)
  expect(olayUygula(yeniSahne(15000), { tip: 'bitti' }).para).toBe(16000)
  expect(olayUygula(yeniSahne(800), { tip: 'bitti' }).para).toBe(4050)
})

test('grep kilitlenir, read kilitlenmez', () => {
  const grep = olayUygula(eylem(yeniSahne(), { tool: 'Grep', pattern: 'TODO' }), { tip: 'eylemBitti', hata: false })
  expect(grep.kilit).toBeGreaterThan(0)
  const read = olayUygula(eylem(yeniSahne(), { tool: 'Read', file_path: 'a.md' }), { tip: 'eylemBitti', hata: false })
  expect(read.kilit).toBe(0)
  expect(read.mod).toBe('yuru')
})

test('freeze sırasında gelen araç sonra oynar', () => {
  let s = olayUygula(yeniSahne(), { tip: 'basla' })
  s = eylem(s, { tool: 'Bash', command: 'ls' })
  s = olayUygula(s, { tip: 'eylemBitti', hata: false })
  expect(s.mod).toBe('freeze')
  s = ilerle(s, 36 + 13)
  expect(s.mod).toBe('c4')
  expect(s.c4?.bitti).toBe(true)
})

test('bitti modunda araç olayları yok sayılır', () => {
  const s = olayUygula(yeniSahne(), { tip: 'bitti' })
  expect(eylem(s, { tool: 'Read', file_path: 'a' })).toEqual(s)
  expect(olayUygula(s, { tip: 'basla' }).mod).toBe('freeze')
})

test('500 olay sonrası diziler sınırlı', () => {
  const araclar = ['Read', 'Edit', 'Bash', 'Agent', 'WebFetch', 'Grep', 'mcp__x__y']
  let s = olayUygula(yeniSahne(), { tip: 'basla' })
  for (let i = 0; i < 500; i++) {
    const r = h(i, 99)
    let o: Olay
    if (r < 0.45) o = { tip: 'eylem', eylem: eylemOku({ tool: araclar[i % araclar.length], file_path: 'a.ts', command: 'ls', url: 'https://x.io' }) }
    else if (r < 0.85) o = { tip: 'eylemBitti', hata: r > 0.8 }
    else o = { tip: 'ajanBitti' }
    s = ilerle(olayUygula(s, o), 1 + Math.floor(h(i, 5) * 6))
  }
  expect(s.parca.length <= 80).toBe(true)
  expect(s.duvarlar.length <= 4).toBe(true)
  expect(s.kirik.length <= 8).toBe(true)
})

test('araç fırtınasında balon en az 22 kare kalır', () => {
  let s = yeniSahne()
  const degisimler: number[] = []
  let onceki = s.balon
  for (let k = 0; k < 66; k++) {
    for (let i = 0; i < 5; i++) s = eylem(s, { tool: 'Read', file_path: `/a/d${k}-${i}.md` })
    s = adim(s)
    if (s.balon !== onceki) { degisimler.push(s.balonKare); onceki = s.balon }
  }
  expect(degisimler.length >= 2).toBe(true)
  for (let i = 1; i < degisimler.length; i++) expect(degisimler[i]! - degisimler[i - 1]! >= 22).toBe(true)
})
