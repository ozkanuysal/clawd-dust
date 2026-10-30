import { expect, test } from 'claude-code/testing'
import { BOS, C } from '../hooks/renk'
import { tuval } from '../hooks/tuval'
import { clawd, namlu } from '../hooks/sprite'
import { nesneler } from '../hooks/dunya'

const dolu = (p: Uint32Array) => p.filter((c) => c !== BOS).length

test('clawd sağa ve sola aynı genişlikte', () => {
  const sag = tuval(60, 20), sol = tuval(60, 20)
  clawd(sag, { x: 20, yon: 1 })
  clawd(sol, { x: 20, yon: -1 })
  expect(dolu(sag.p)).toBeGreaterThan(0)
  expect(dolu(sol.p)).toBe(dolu(sag.p))
})

test('keleş namlusu gövdenin önünde', () => {
  expect(namlu(10, 8, 1).x).toBe(27)
  expect(namlu(10, 8, -1).x).toBe(10 + 12 - 17)
})

test('nesneler deterministik ve ilk 60 piksel boş', () => {
  const a = nesneler(0, 400)
  expect(nesneler(0, 400)).toEqual(a)
  expect(a.length).toBeGreaterThan(0)
  a.forEach((n) => expect(n.x >= 60).toBe(true))
  for (let i = 1; i < a.length; i++) expect(a[i]!.x - a[i - 1]!.x >= 40).toBe(true)
})

const say = (p: Uint32Array, renk: number) => p.filter((c) => c === renk).length

test('clawd silahı eldivenli elleriyle tutar', () => {
  const t = tuval(60, 12)
  clawd(t, { x: 20 })
  expect(say(t.p, C.glove)).toBe(2)
})

test('clawd asker ekipmanı taşır: sırt çantası, anten, bot', () => {
  const t = tuval(60, 12)
  clawd(t, { x: 20 })
  expect(say(t.p, C.pack) > 0).toBe(true)
  expect(say(t.p, C.antenna) > 0).toBe(true)
  expect(say(t.p, C.boot) > 0).toBe(true)
})

test('clawd gölgeli: üç turuncu tonu var', () => {
  const t = tuval(60, 12)
  clawd(t, { x: 20 })
  for (const r of [C.o, C.oL, C.oD]) expect(say(t.p, r) > 0).toBe(true)
})

test('ifade yüzü değiştirir', () => {
  const ciz = (ifade: 'normal' | 'kisik' | 'saskin' | 'mutlu') => {
    const t = tuval(60, 12)
    clawd(t, { x: 20, ifade, kare: 1 })
    return Array.from(t.p).join()
  }
  const yuzler = new Set([ciz('normal'), ciz('kisik'), ciz('saskin'), ciz('mutlu')])
  expect(yuzler.size).toBe(4)
})
