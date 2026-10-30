// Clawd Dust — palet ve tohumlu gürültü. Saf.

export const BOS = 0x01000000 // terminalin varsayılan rengi

export const C = {
  sky1: 0xa9c6d6, sky2: 0xdfe9ea, far: 0xcbbfa8, farD: 0xb3a68d, sun: 0xfffbe8,
  sand: 0xcfa968, sandD: 0xb88f52, sandK: 0x9c7642, sandL: 0xdcbb7d,
  stone: 0xc9b48e, stoneD: 0xa8946e, stoneL: 0xdac8a3,
  crate: 0xa9712f, crateD: 0x6f461d, crateL: 0xc58a43,
  o: 0xd97757, oL: 0xeb9a74, oD: 0xb35a3e, eye: 0x2b1b17,
  helm: 0x5d6b3b, helmL: 0x7f8f52, helmD: 0x3f4a27, helmN: 0x4b5730, strap: 0x2f3720,
  vest: 0x7b6f4b, vestD: 0x5f5539, pouch: 0x8c7f57, brow: 0x6e2f1f,
  glove: 0x3a3328, boot: 0x3b3027, pack: 0x6a5f40, packD: 0x4f4630, antenna: 0x1a1b1e, ear: 0x2c2e33,
  tan: 0xb59a62, tanL: 0xd2b981, tanD: 0x8a7446, lens: 0x7fd3e0,
  wood: 0x8a5a2b, woodL: 0xa8703a, woodD: 0x6b4220, bakalit: 0x8f4a25,
  metal: 0x2c2e33, metalL: 0x4a4d55, barrel: 0x3a3d43, muzzle: 0x1a1b1e,
  bot: 0x4a4f57, botD: 0x30343a, visor: 0xff5a4f,
  flash: 0xfff1a8, fire: 0xff9a3c, white: 0xf7f4ec, red: 0xe5484d, green: 0x5bbf5a, bar: 0x3b3a35, tracer: 0xffe08a,
  smoke: 0xdcd8cf, smokeD: 0xbab5aa, smokeL: 0xefece5, c4: 0x56632e, c4D: 0x2f3818, led: 0xff3b30, ledD: 0x5a1a14,
  star: 0xffd23f, brass: 0xd9a441, hole: 0x2e2116,
  teal: 0x2f8a8f, tealD: 0x23686c, tealL: 0x4fa9aa, iron: 0x3b3b3b, stud: 0x9a9a9a, gap: 0x1a1612, lamp: 0xffcf6b,
  panel: 0x2a2118, panelL: 0x5b4a33,
}

export function h(a: number, b: number): number {
  let x = Math.imul(((a | 0) * 73856093) ^ ((b | 0) * 19349663), 2654435761)
  x ^= x >>> 15
  x = Math.imul(x, 2246822519)
  x ^= x >>> 13
  return ((x >>> 0) % 10000) / 10000
}

export function mix(a: number, b: number, t: number): number {
  const k = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t)
  return (k(16) << 16) | (k(8) << 8) | k(0)
}
