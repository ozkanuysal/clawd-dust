import { expect, test } from 'claude-code/testing'
import { h, mix, BOS } from '../hooks/renk'

test('h deterministik ve [0,1)', () => {
  expect(h(3, 7)).toBe(h(3, 7))
  for (let i = 0; i < 200; i++) {
    const r = h(i, 11)
    expect(r >= 0 && r < 1).toBe(true)
  }
})

test('mix uçları korur', () => {
  expect(mix(0x000000, 0xffffff, 0)).toBe(0x000000)
  expect(mix(0x000000, 0xffffff, 1)).toBe(0xffffff)
  expect(BOS).toBe(0x01000000)
})
