import { expect, test } from 'claude-code/testing'
import { DUSUNUYOR, KONTROL } from '../hooks/metin'
import { yeniSahne, olayUygula, adim, type Sahne } from '../hooks/sahne'
import { OYUNCU_SURE } from '../hooks/oyuncu'

const ilerle = (s: Sahne, n: number) => {
  for (let i = 0; i < n; i++) s = adim(s)
  return s
}

test('freeze sırasında tuş yok sayılır', () => {
  const s = olayUygula(yeniSahne(), { tip: 'basla' })
  expect(olayUygula(s, { tip: 'oyuncu', komut: 'sag' })).toEqual(s)
})

test('sag 12 piksel ilerletir', () => {
  const s = olayUygula(yeniSahne(), { tip: 'oyuncu', komut: 'sag' })
  expect(s.balon).toBe(KONTROL)
  expect(ilerle(s, 13).x - s.x).toBe(12)
})

test('zipla havaya kaldırır', () => {
  const s = ilerle(olayUygula(yeniSahne(), { tip: 'oyuncu', komut: 'zipla' }), 2)
  expect(s.zy).toBeGreaterThan(0)
})

test('ates önündeki duvara delik açar', () => {
  let s = olayUygula(yeniSahne(), { tip: 'eylem', eylem: { tur: 'yaz', metin: 'x' } })
  s = ilerle(s, 10)
  const once = s.duvarlar[0]!.delik
  s = olayUygula({ ...s, mod: 'yuru' }, { tip: 'oyuncu', komut: 'ates' })
  expect(s.duvarlar[0]!.delik).toBe(once + 1)
})

test('55 kare sonra kontrol Claude a döner', () => {
  const s = ilerle(olayUygula(yeniSahne(), { tip: 'oyuncu', komut: 'sol' }), OYUNCU_SURE)
  expect(OYUNCU_SURE).toBe(55)
  expect(s.oyuncu).toBe(0)
  expect(s.balon).toBe(DUSUNUYOR)
})
