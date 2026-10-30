import { expect, test } from 'claude-code/testing'
import { BOS } from '../hooks/renk'
import { tuval, px, hucrele, metinYaz } from '../hooks/tuval'

const hucre = (hc: Uint32Array, sutun: number, r: number, c: number) => {
  const i = (r * sutun + c) * 3
  return [hc[i], hc[i + 1], hc[i + 2]]
}

test('hucrele boş tuvali boşluk yapar', () => {
  const hc = hucrele(tuval(4, 20), 4, 10)
  expect(hc.length).toBe(4 * 10 * 3)
  for (let r = 0; r < 10; r++) for (let c = 0; c < 4; c++) expect(hucre(hc, 4, r, c)).toEqual([0x20, BOS, BOS])
})

test('hucrele üst ve alt pikseli eşler', () => {
  const t = tuval(4, 20)
  px(t, 0, 18, 0xff0000)
  px(t, 0, 19, 0x00ff00)
  expect(hucre(hucrele(t, 4, 10), 4, 9, 0)).toEqual([0x2580, 0xff0000, 0x00ff00])
})

test('hucrele yalnız alt piksel doluysa alt yarım blok', () => {
  const t = tuval(1, 20)
  px(t, 0, 19, 0x00ff00)
  expect(hucre(hucrele(t, 1, 10), 1, 9, 0)).toEqual([0x2584, 0x00ff00, BOS])
})

test('hucrele kısa bantta üstten kırpar', () => {
  const t = tuval(2, 20)
  px(t, 0, 8, 0x123456)
  expect(hucre(hucrele(t, 2, 6), 2, 0, 0)).toEqual([0x2580, 0x123456, BOS])
})

test('metinYaz taşanı keser', () => {
  const hc = new Uint32Array(5 * 2 * 3)
  metinYaz(hc, 5, 3, 0, 'abcd', 1, 2)
  expect(hucre(hc, 5, 0, 3)).toEqual(['a'.codePointAt(0), 1, 2])
  expect(hucre(hc, 5, 0, 4)).toEqual(['b'.codePointAt(0), 1, 2])
  expect(hucre(hc, 5, 1, 0)).toEqual([0, 0, 0])
})
