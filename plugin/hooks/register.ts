// Clawd Dust — Claude Code bağlantısı. $ kullanan tek dosya; sahne, dünya, çizim ve metin modülleri saftır.

import type { Hook, Register, Timer } from 'claude-code'
import { yeniSahne, olayUygula, adim, type Olay } from './sahne'
import { sahneHucreleri } from './cizim'
import { base64 } from './tuval'
import { eylemOku, para } from './metin'

type Motor = Parameters<Hook<'turn.start'>>[0]

const KARE_MS = 90 // ~11 fps
const SATIR = 6 // bant yüksekliği: 6 satır = 12 piksel
const KAPANIS_MS = 2000
const ANAHTAR = 'sahne'
const AJAN = new Set(['Agent', 'Task'])

const sinir = (n: number, alt: number, ust: number) => Math.max(alt, Math.min(ust, n))

let acik = true
let gorunur = false
let sahne = yeniSahne()
let bant: { requestId: string; sutun: number; satir: number } | null = null
let saat: Timer | null = null
let kapanis: Timer | null = null
let ciziliyor = false
let masaustu = '' // terminal dışı yüzeyde son çizilen satır; boşsa terminal

const olay = (o: Olay) => {
  sahne = olayUygula(sahne, o)
}

// Önceki kare basılmadan yenisi başlamaz
const masaustuSatiri = () => `Clawd: ${sahne.balon || 'round kazanıldı'} · ${para(sahne.para)}`

async function kareCiz($: Motor) {
  sahne = adim(sahne)
  // Terminal dışında blit yok: satır değişince yeniden çizdir
  if (masaustu && masaustuSatiri() !== masaustu) $.ui.invalidate('ui.render')
  if (!bant || ciziliyor) return
  ciziliyor = true
  try {
    const { requestId, sutun, satir } = bant
    const cells = base64(sahneHucreleri(sahne, sutun, satir))
    const r = await $.ui.blit({ requestId, key: ANAHTAR, cells, columns: sutun, rows: satir })
    if (r && 'deny' in r && r.deny) $.ui.invalidate('ui.render')
  } catch {
    $.ui.invalidate('ui.render')
  } finally {
    ciziliyor = false
  }
}

function durdur() {
  saat?.cancel()
  kapanis?.cancel()
  saat = null
  kapanis = null
}

function gizle($: Motor) {
  durdur()
  gorunur = false
  bant = null
  masaustu = ''
  $.ui.invalidate('ui.render')
}

function baslat($: Motor) {
  kapanis?.cancel()
  kapanis = null
  gorunur = true
  olay({ tip: 'basla' })
  if (!saat) saat = $.clock.every(KARE_MS, () => void kareCiz($))
  $.ui.invalidate('ui.render')
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    acik = (await $.store.get('acik')) !== false
    sahne = yeniSahne()
    await $.command.register({ name: 'dust', description: 'Clawd Dust bandını aç/kapat', immediate: true })
    return next(e)
  })

  on('command.run', { command: 'dust' }, async ($) => {
    acik = !acik
    await $.store.set('acik', acik)
    if (!acik) gizle($)
    return { text: acik ? 'Clawd Dust açık.' : 'Clawd Dust kapalı.' }
  })

  on('turn.start', async ($, e, next) => {
    if (acik && !e.agentId) baslat($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId || !gorunur) return next(e)
    olay({ tip: 'bitti' })
    kapanis?.cancel()
    kapanis = $.clock.after(KAPANIS_MS, () => gizle($))
    return next(e)
  })

  // Ayar kancalarının kopyalarını dinleriz: tool.call içinde next() beklemek uzun bir Bash boyunca saati durdururdu
  on('classic.PreToolUse', async ($, e, next) => {
    if (gorunur) olay({ tip: 'eylem', eylem: eylemOku(e as { tool?: string }) })
    return next(e)
  })

  function aracBitti(e: { tool_name?: string }, hata: boolean) {
    if (!gorunur) return
    if (AJAN.has(String(e.tool_name))) olay({ tip: 'ajanBitti' })
    olay({ tip: 'eylemBitti', hata })
  }

  on('classic.PostToolUse', async ($, e, next) => {
    const yanit = e.tool_response as { is_error?: boolean; isError?: boolean } | null
    aracBitti(e, yanit?.is_error === true || yanit?.isError === true)
    return next(e)
  })

  on('classic.PostToolUseFailure', async ($, e, next) => {
    aracBitti(e, true)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!acik || !gorunur) return next(e)
    if (e.surface !== 'terminal') {
      const { Text } = $.ui.resolve(e)
      masaustu = masaustuSatiri()
      return Text({ wrap: 'truncate', children: [masaustu] })
    }
    const { Box, Raster } = $.ui.resolve(e)
    const sutun = sinir(e.props.bodyColumns || 80, 20, 512)
    const satir = SATIR
    bant = { requestId: e.requestId, sutun, satir }
    const cells = base64(sahneHucreleri(sahne, sutun, satir))
    // Raster bandın doğrudan çocuğu kalır: blit'li kareler onu adresler
    return Box({
      flexDirection: 'column',
      children: [Raster({ key: ANAHTAR, columns: sutun, rows: satir, cells })],
    })
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (!gorunur) return next(e)
    return next({ ...e, props: { ...e.props, suffix: `${e.props.suffix || ''} · ${para(sahne.para)}` } })
  })
}
