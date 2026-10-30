import { expect, test } from 'claude-code/testing'
import { eylemOku, DUSUNUYOR } from '../hooks/metin'
import { yeniSahne, olayUygula, adim, type Sahne, type Olay } from '../hooks/sahne'
import { sahneHucreleri } from '../hooks/cizim'
import { C } from '../hooks/renk'

const satirMetni = (hc: Uint32Array, sutun: number, r: number) =>
  Array.from({ length: sutun }, (_, c) => String.fromCodePoint(hc[(r * sutun + c) * 3] ?? 0x20)).join('')

test('boyut doğru', () => {
  expect(sahneHucreleri(yeniSahne(), 100, 6).length).toBe(1800)
})

test('balon satır 0 da', () => {
  expect(satirMetni(sahneHucreleri(yeniSahne(), 100, 6), 100, 0)).toContain(DUSUNUYOR)
})

test('bitti afişi', () => {
  const s = olayUygula(yeniSahne(), { tip: 'bitti' })
  expect(satirMetni(sahneHucreleri(s, 100, 6), 100, 0)).toContain('ROUND KAZANILDI')
})

test('dar bantta tüm modlar çizilir', () => {
  const e = (tool: string) => ({ tip: 'eylem', eylem: eylemOku({ tool, file_path: 'a.ts', command: 'ls', pattern: 'x', url: 'https://a.io' }) }) as Olay
  const senaryolar: Olay[][] = [
    [{ tip: 'basla' }],
    [e('Read')], [e('Grep'), { tip: 'eylemBitti', hata: false }], [e('Edit')], [e('Bash')], [e('Bash'), { tip: 'eylemBitti', hata: false }],
    [e('WebFetch')], [e('Agent'), e('Agent')], [e('mcp__a__b')], [{ tip: 'eylemBitti', hata: true }], [{ tip: 'bitti' }],
    [{ tip: 'oyuncu', komut: 'ates' }], [{ tip: 'oyuncu', komut: 'bomba' }],
  ]
  for (const olaylar of senaryolar) {
    let s: Sahne = olaylar.reduce(olayUygula, yeniSahne())
    for (let k = 0; k <= 120; k++) {
      for (const [sutun, satir] of [[20, 6], [120, 6]] as [number, number][]) expect(sahneHucreleri(s, sutun, satir).length).toBe(sutun * satir * 3)
      s = adim(s)
    }
  }
})

test('sahne 12 piksele sığar: Clawd balonun altında, kum en altta', () => {
  const hc = sahneHucreleri({ ...yeniSahne(), balon: '' }, 60, 6)
  const kumlar = [C.sand, C.sandD, C.sandK, C.sandL]
  for (let c = 0; c < 60; c++) expect(kumlar.includes(hc[(5 * 60 + c) * 3 + 1]!)).toBe(true)
  const kaskVar = Array.from({ length: 60 }, (_, c) => hc[(1 * 60 + c) * 3 + 1]).includes(0x7f8f52)
  expect(kaskVar).toBe(true)
})
