# Clawd Dust

Claude çalışırken istem satırının hemen üstünde 6 satırlık bir piksel sahne açılır. Çöl temalı,
taktik nişancı havasındaki bir haritada Clawd kasklı ve keleşli ilerler. Claude'un o an kullandığı
araca göre bir aksiyon oynar. Kod sıfırdan yazıldı. Oyuna ait ad, logo ya da görsel kullanılmadı.

| Claude ne yapıyor | Sahnede |
|---|---|
| Tur başlar | Freeze time: satın alma paneli, şarjör değiştirme, sonra `GO GO GO` |
| Read / Grep / Glob | Diz çöküp dürbünle tarar; Grep bitince nişangah kırmızıya döner |
| Edit / Write | Duvara ateş eder, mermi delikleri `CLAWD` yazar |
| Bash | C4 kurar, geri çekilir; komut bitince patlar |
| Agent | Gözlüklü takım arkadaşı katılır |
| WebFetch / WebSearch | Smoke atar |
| Araç hata verir | Bot düşman çıkar, Clawd siper alır |
| Tur biter | `ROUND KAZANILDI · MVP` |

Spinner'ın yanında para görünür: `· $ 1.400`. Başarılı her araç +$300, her hata −$300 getirir;
tur sonunda +$3.250 eklenir (tavan $16.000).

## Kurulum

Claude Code 2.1.287 veya üstü gerekir. Claude Code'un içinde:

```
/plugin install clawd-dust --marketplace ozkanuysal/clawd-dust
```

Marketplace'i eklemek için `y` de, sonra kapsamı seç.

`/dust` bandı açar veya kapatır. Tercih saklanır, varsayılan açık.

## Geliştirme

```bash
claude plugin test plugin                 # testler
claude plugin validate plugin --strict    # doğrulama
bun araclar/onizle.ts > onizleme.html     # Claude'suz önizleme
```
