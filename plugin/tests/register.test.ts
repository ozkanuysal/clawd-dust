import { expect, mock, test } from 'claude-code/testing'

const BANT = {
  plugin: 'clawd-dust',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 12, bodyColumns: 100, scroll: { offset: 0, bodyRows: 12 }, view: {} },
} as const
const SPINNER = {
  plugin: 'clawd-dust',
  component: 'Spinner',
  requestId: 'spinner',
  props: { word: 'Çalışıyor', message: null, suffix: '', mode: 'responding' },
} as const

// Altta motor yok: bu hook'lar motorun yerine geçer
function kur(on: any) {
  const kayit = { depo: new Map<string, unknown>(), blitler: [] as unknown[], yenile: 0 }
  const clock = mock.clock(on)
  on('store.get', (_: any, e: any) => ({ value: kayit.depo.get(e.key) }))
  on('store.set', (_: any, e: any) => {
    kayit.depo.set(e.key, e.value)
    return { value: undefined }
  })
  on('command.register', () => ({ value: undefined }))
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('ui.blit', (_: any, e: any) => {
    kayit.blitler.push(e)
    return { value: {} }
  })
  on('ui.invalidate', () => {
    kayit.yenile++
    return { value: undefined }
  })
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return Text({ children: [e.component === 'Spinner' ? `spinner${e.props.suffix}` : 'motor çizdi'] })
  })
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('command.run', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  on('classic.PostToolUse', () => ({}))
  on('classic.PostToolUseFailure', () => ({}))
  return { kayit, clock }
}

async function oturum($: any, surface = 'terminal') {
  await $.session.start({ surface, isInteractive: true, cwd: '/w' })
}

test('tur başlayınca bant raster çizer', async ($, on) => {
  kur(on)
  await oturum($)
  await $.turn.start({ text: 'x', turnId: 't1' })
  const ui = await $.ui.mount({ ...BANT, surface: 'terminal' })
  const r = await ui.find({ type: 'Raster' })
  expect(r?.props.columns).toBe(100)
  expect(r?.props.rows).toBe(6)
  expect(await ui.find({ type: 'Button' })).toBeUndefined()
  await ui.unmount()
})

test('saat kare basar', async ($, on) => {
  const { kayit, clock } = kur(on)
  await oturum($)
  await $.turn.start({ text: 'x', turnId: 't1' })
  const ui = await $.ui.mount({ ...BANT, surface: 'terminal' })
  await clock.advance(900)
  expect(kayit.blitler.length >= 9).toBe(true)
  await ui.unmount()
})

test('desktop tek satır', async ($, on) => {
  kur(on)
  await oturum($, 'desktop')
  await $.turn.start({ text: 'x', turnId: 't1' })
  const ui = await $.ui.mount({ ...BANT, surface: 'desktop' })
  const t = await ui.find({ type: 'Text', text: /^Clawd:/ })
  expect(t?.text).toContain('$ 800')
  await ui.unmount()
})

test('spinner parayı gösterir, başarılı araç para ekler', async ($, on) => {
  kur(on)
  await oturum($)
  await $.turn.start({ text: 'x', turnId: 't1' })
  let ui = await $.ui.mount({ ...SPINNER, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /spinner/ }))?.text).toBe('spinner · $ 800')
  await ui.unmount()
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.classic.PostToolUse({ tool_name: 'Bash', tool_input: { command: 'ls' }, tool_response: {}, tool_use_id: 'u1' })
  ui = await $.ui.mount({ ...SPINNER, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /spinner/ }))?.text).toBe('spinner · $ 1.100')
  await ui.unmount()
})

test('alt ajan turu bandı açmaz', async ($, on) => {
  kur(on)
  await oturum($)
  await $.turn.start({ text: 'x', turnId: 't1', agentId: 'a1' })
  const ui = await $.ui.mount({ ...BANT, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /motor çizdi/ })).toBeDefined()
  await ui.unmount()
})

test('dust kapatınca saat durur', async ($, on) => {
  const { kayit, clock } = kur(on)
  await oturum($)
  await $.turn.start({ text: 'x', turnId: 't1' })
  const sonuc = await $.command.run({ command: 'dust', args: '' } as any)
  expect(sonuc.text).toBe('Clawd Dust kapalı.')
  const once = kayit.blitler.length
  await clock.advance(900)
  expect(kayit.blitler.length).toBe(once)
  expect(kayit.depo.get('acik')).toBe(false)
  await $.turn.start({ text: 'y', turnId: 't2' })
  const ui = await $.ui.mount({ ...BANT, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster' })).toBeUndefined()
  await ui.unmount()
})

test('turn.complete 2 sn sonra kapatır', async ($, on) => {
  const { clock } = kur(on)
  await oturum($)
  await $.turn.start({ text: 'x', turnId: 't1' })
  await $.turn.complete({ turnId: 't1', answer: '', durationMs: 1, isAborted: false, reason: 'answer' })
  let ui = await $.ui.mount({ ...BANT, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster' })).toBeDefined()
  await ui.unmount()
  await clock.advance(2000)
  ui = await $.ui.mount({ ...BANT, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster' })).toBeUndefined()
  await ui.unmount()
})

test('desktop satırı balon değişince yeniden çizilir', async ($, on) => {
  const { kayit, clock } = kur(on)
  await oturum($, 'desktop')
  await $.turn.start({ text: 'x', turnId: 't1' })
  const ui = await $.ui.mount({ ...BANT, surface: 'desktop' })
  const once = kayit.yenile
  await clock.advance(4000)
  expect(kayit.yenile > once).toBe(true)
  await ui.unmount()
})
