// Sahneleri Claude Code olmadan HTML'e çizer: bun araclar/onizle.ts > onizleme.html
import { eylemOku } from '../plugin/hooks/metin'
import { yeniSahne, olayUygula, adim, type Olay, type Sahne } from '../plugin/hooks/sahne'
import { sahneHucreleri } from '../plugin/hooks/cizim'

const SUTUN = 120, SATIR = 6
const e = (tool: string, ek: Record<string, unknown> = {}): Olay => ({ tip: 'eylem', eylem: eylemOku({ tool, ...ek }) })
const bitti: Olay = { tip: 'eylemBitti', hata: false }

// [ad, kareye göre olaylar, gösterilecek kare]
const SENARYOLAR: [string, Record<number, Olay[]>, number][] = [
  ['freeze', { 0: [{ tip: 'basla' }] }, 14],
  ['freeze şarjör', { 0: [{ tip: 'basla' }] }, 27],
  ['GO', { 0: [{ tip: 'basla' }] }, 44],
  ['Read', { 0: [e('Read', { file_path: '/a/README.md' })] }, 20],
  ['Grep kilit', { 0: [e('Grep', { pattern: 'TODO' })], 10: [bitti] }, 22],
  ['Edit', { 0: [e('Edit', { file_path: '/a/register.ts' })] }, 30],
  ['Bash kurulum', { 0: [e('Bash', { command: 'npm test' })] }, 20],
  ['Bash geri', { 0: [e('Bash', { command: 'npm test' })] }, 62],
  ['Bash patlama', { 0: [e('Bash', { command: 'npm test' })], 50: [bitti] }, 63],
  ['Agent', { 0: [e('Agent', { description: 'testleri bul' })] }, 30],
  ['Smoke uçuş', { 0: [e('WebFetch', { url: 'https://github.com' })] }, 10],
  ['Smoke sis', { 0: [e('WebFetch', { url: 'https://github.com' })] }, 50],
  ['Hata ateş', { 0: [{ tip: 'eylemBitti', hata: true }] }, 28],
  ['Hata siper', { 0: [{ tip: 'eylemBitti', hata: true }] }, 82],
  ['Tur bitti', { 0: [{ tip: 'bitti' }] }, 9],
  ['Agent yürüyüş', { 0: [e('Agent', { description: 'x' })] }, 9],
]

const kareler = SENARYOLAR.map(([ad, olaylar, son]) => {
  let s: Sahne = { ...yeniSahne(), x: 30 }
  for (let k = 0; k <= son; k++) {
    for (const o of olaylar[k] ?? []) s = olayUygula(s, o)
    if (k < son) s = adim(s)
  }
  return { ad, hucre: Array.from(sahneHucreleri(s, SUTUN, SATIR)) }
})

console.log(`<!doctype html><meta charset="utf-8"><body style="background:#12110e;color:#ccc;font:13px monospace;margin:12px">
<script>
const K=${JSON.stringify(kareler)}, S=8, W=${SUTUN}, R=${SATIR}, BOS=0x01000000
const hx=c=>c===BOS?'#12110e':'#'+c.toString(16).padStart(6,'0')
for (const {ad,hucre} of K) {
  const d=document.createElement('div'); d.textContent=ad; document.body.appendChild(d)
  const c=document.createElement('canvas'); c.width=W*S; c.height=R*2*S; c.style.marginBottom='10px'; document.body.appendChild(c)
  const x=c.getContext('2d'); x.font=(S*1.6)+'px monospace'; x.textAlign='center'; x.textBaseline='middle'
  for (let r=0;r<R;r++) for (let k=0;k<W;k++) {
    const i=(r*W+k)*3, cp=hucre[i], fg=hucre[i+1], bg=hucre[i+2], X=k*S, Y=r*2*S
    if (cp===0x2580) { x.fillStyle=hx(fg); x.fillRect(X,Y,S,S); x.fillStyle=hx(bg); x.fillRect(X,Y+S,S,S) }
    else if (cp===0x2584) { x.fillStyle=hx(bg); x.fillRect(X,Y,S,S); x.fillStyle=hx(fg); x.fillRect(X,Y+S,S,S) }
    else { x.fillStyle=hx(bg); x.fillRect(X,Y,S,2*S); if (cp!==0x20) { x.fillStyle=hx(fg); x.fillText(String.fromCodePoint(cp),X+S/2,Y+S) } }
  }
}
</script>`)
