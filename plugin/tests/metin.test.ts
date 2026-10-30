import { expect, test } from 'claude-code/testing'
import { ekle, eylemOku, para, temizle } from '../hooks/metin'

test('ekle belirtme ve yönelme', () => {
  expect(ekle('README.md', 'belirtme')).toBe("README.md'yi")
  expect(ekle('register.js', 'yonelme')).toBe("register.js'ye")
  expect(ekle('main.go', 'yonelme')).toBe("main.go'ya")
  expect(ekle('notlar', 'yonelme')).toBe("notlar'a")
})

test('okuma araçları tarar', () => {
  expect(eylemOku({ tool: 'Read', file_path: '/a/README.md' })).toEqual({ tur: 'tara', metin: "README.md'yi tarıyor" })
  expect(eylemOku({ tool: 'Grep', pattern: 'TODO' })).toEqual({ tur: 'tara', metin: '"TODO" arıyor', grep: true })
  expect(eylemOku({ tool: 'Glob', pattern: '*.ts' })).toEqual({ tur: 'tara', metin: '"*.ts" arıyor' })
})

test('yazma, bash, ajan, web ve diğerleri', () => {
  expect(eylemOku({ tool: 'Edit', file_path: '/a/register.js' })).toEqual({ tur: 'yaz', metin: "register.js'ye yazıyor" })
  expect(eylemOku({ tool: 'Bash', command: 'cd x && FOO=1 npm test' })).toEqual({ tur: 'c4', metin: 'npm test kuruyor' })
  expect(eylemOku({ tool: 'Agent', description: 'testleri bul' })).toEqual({ tur: 'ajan', metin: 'takım arkadaşı: testleri bul' })
  expect(eylemOku({ tool: 'WebFetch', url: 'https://www.github.com/a' })).toEqual({ tur: 'smoke', metin: 'smoke atıyor: github.com' })
  expect(eylemOku({ tool: 'WebSearch', query: 'pixel art' })).toEqual({ tur: 'smoke', metin: 'smoke atıyor: pixel art' })
  expect(eylemOku({ tool: 'mcp__srv__do_it' })).toEqual({ tur: 'is', metin: 'srv do_it ile uğraşıyor' })
})

test('para biçimi', () => {
  expect(para(1400)).toBe('$ 1.400')
  expect(para(800)).toBe('$ 800')
  expect(para(16000)).toBe('$ 16.000')
})

test('temizle tek genişlik dışını soru işareti yapar', () => {
  expect(temizle('a\u0007b🙂漢')).toBe('a b??')
  expect([...eylemOku({ tool: 'Read', file_path: 'x'.repeat(300) }).metin].length <= 40).toBe(true)
  expect([...eylemOku({ tool: 'Bash', command: 'y'.repeat(300) }).metin].length <= 40).toBe(true)
})
