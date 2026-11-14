# trtinyhands · Website

Özel tasarım 3D baskı oyuncak ve figür firması için kurumsal + e-ticaret vitrini.
Kurulum gerektirmez — `index.html` dosyasını bir tarayıcıda açmanız yeterlidir.

> **Not:** Yerel bir sunucuyla çalıştırmak isterseniz `python -m http.server 8123`
> yeterli.
>
> **Önbellek:** CSS/JS bağlantıları `?v=13` sürüm etiketi taşır. Bir dosyayı
> değiştirdikten sonra tarayıcının eskisini göstermemesi için üç HTML dosyasındaki
> bu numarayı artırın (`?v=14` …). Yine de görmüyorsanız **Ctrl+Shift+R** ile
> sert yenileme yapın.

## Dosya Yapısı

```
yildiz/
├─ index.html              # Mağaza: ürün ızgarası, filtre, arama
├─ detail.html             # Ürün detay sayfası  (detail.html?id=<ürün-id>)
├─ legal.html              # Yasal sayfalar      (legal.html?page=<slug>)
├─ admin.html              # Ürün yönetim paneli ← ürünleri buradan düzenleyin
├─ assets/
│  ├─ css/
│  │  ├─ style.css         # Mağaza stilleri + responsive kurallar
│  │  └─ admin.css         # Yönetim paneli stilleri
│  └─ js/
│     ├─ products.js       # VERİ: ürünler (panel bu dosyayı üretir)
│     ├─ legal.js          # VERİ: firma bilgileri + yasal metinler
│     ├─ store.js          # ORTAK: sepet, WhatsApp sipariş, figür görselleri,
│     │                    #        kaydırma efektleri, footer (window.YF)
│     ├─ main.js           # Mağaza sayfası mantığı (filtre, arama)
│     ├─ detail.js         # Ürün detay sayfası mantığı
│     ├─ legal-view.js     # Yasal sayfa görünümü
│     ├─ admin.js          # Yönetim paneli mantığı
│     └─ cropper.js        # Görsel kırpma aracı (kütüphanesiz)
└─ README.md
```

Her sayfa `products.js` → `store.js` → (sayfaya özel script) sırasıyla yüklenir.
`legal.js` yalnızca `legal.html` tarafından kullanılır.

## Özellikler

- **Yönetim paneli** — `admin.html` üzerinden ürün ekleme/düzenleme/silme,
  sıralama, görsel yükleme + kırpma, etiket ve indirim yönetimi, canlı önizleme.
- **Dinamik ürün listesi** — Ürünler `products.js` içindeki `PRODUCTS` dizisinden otomatik oluşur.
- **Kategori filtresi + arama** — Anlık filtreleme.
- **Ürün detay sayfası** — Görsel, etiketler, adet seçici, teknik özellikler, ilgili ürünler.
- **Sepet** — Ekle/çıkar, adet, toplam; `localStorage`'da saklanır (sayfa
  yenilense de kaybolmaz). Sepet her yüklenişte ayıklanır: katalogdan silinmiş
  ürünler, bozuk adetler ve tükenmiş/stok üstü miktarlar temizlenir.
- **Yasal sayfalar** — Mesafeli satış, iade, teslimat, gizlilik, KVKK, çerez
  politikası. `legal.html?page=<slug>` ile doğrudan açılır; şu an siteden
  hiçbir bağlantı verilmiyor.
- **Responsive** — Masaüstü, tablet ve mobil uyumlu.
- **WhatsApp ile sipariş** — "Ödemeye Geç" sepeti biçimli bir mesaja çevirip
  `wa.me` üzerinden sipariş numarasına yönlendirir.
- **Figür görselleri** — Sistem emojisi yerine OpenMoji SVG seti; her işletim
  sisteminde aynı görünür, CDN'e ulaşılamazsa emoji karakterine geri düşer.
- **Kaydırma efektleri** — İlerleme çubuğu, sıkışan başlık, tanıtım bandında
  parallax, IntersectionObserver ile kademeli içerik açılışı.
- **Erişilebilirlik** — `prefers-reduced-motion` desteği; sepet çekmecesinde
  odak tuzağı ve `inert`.

## Ürün Yönetimi (admin paneli)

`admin.html` dosyasını tarayıcıda açın. Sol sütunda ürün listesi, ortada
düzenleme formu, sağda **canlı önizleme** vardır — yaptığınız her değişiklik
anında hem ana sayfa kartı hem ürün sayfası görünümünde belirir.

> Önizlemedeki kart, mağazanın kendi `productCard()` fonksiyonuyla üretilir
> (`store.js`). Kart tasarımını değiştirdiğinizde önizleme kendiliğinden uyar;
> iki yerde ayrı kart kodu tutulmaz.

### Nasıl yayına alınır

Site statik olduğu için kaydedecek bir sunucu yok. Akış şudur:

1. Panelde ürünleri düzenleyin (taslak tarayıcınızda otomatik saklanır)
2. Üstteki **products.js İndir** düğmesine basın
3. İnen dosyayı sitenizdeki `assets/js/` klasörüne yükleyip eskisinin
   üzerine yazın

Yüklediğiniz anda değişiklikler tüm ziyaretçilerde görünür. **İçe Aktar** ile
sitede yayında olan `products.js` dosyasını panele geri okutabilirsiniz —
başka bir bilgisayardan devam ederken bunu kullanın.

> Ziyaretçilerin tarayıcısı eski dosyayı önbellekten göstermesin diye
> `index.html`, `detail.html` ve `legal.html` içindeki `?v=` numarasını da
> artırın.

### Görsel yükleme

Kart oranı **4:5**. Dosya seçtiğinizde ya da sürükleyip bıraktığınızda kırpma
aracı açılır: görseli sürükleyerek konumlandırın, fare tekerleği veya
kaydırıcıyla yakınlaştırın. Çıktı 800×1000 WebP olarak sıkıştırılır ve
`products.js` içine gömülür — ayrıca görsel barındırmanız gerekmez.

Görsel yüklemezseniz ürün, **yedek figür** alanındaki emojinin OpenMoji
karşılığıyla gösterilir.

> Görseller dosyaya gömüldüğü için katalog büyüdükçe `products.js` de büyür.
> Üstteki **Taslak: x.xx MB** göstergesi tarayıcı deposundaki yeri izler
> (sınır ~5 MB). 30-40 ürünü aşarsanız görselleri ayrı dosyalara taşımak
> daha doğru olur.

### Etiketler

Etiketler ana sayfadaki kartın sol üstünde ve ürün sayfasında görünür.
Hazır etiketler: Çok Satan, Yeni, Son Adet, Özel Tasarım, Elde Boyandı. Kartta blob şeklinin altında, ürün adının üstünde dururlar. **İndirim etiketi otomatiktir** — eski fiyat girdiğinizde
"%40 İndirim" rozeti kendiliğinden eklenir ve dikkat çekmesi için hafifçe
nabız atar.

Yeni etiket tanımlamak için `products.js` içindeki `BADGES` nesnesine bir
satır ekleyin; `tone` değeri rengi belirler (`gold`, `sage`, `sale`, `clay`,
`lilac`, `blush`).

### Stok

Her ürünün bir **stok adedi** vardır; ürün sayfasındaki rozetin rengini ve
metnini belirler:

| Stok | Rozet | Renk |
|---|---|---|
| 0 | Tükendi | kırmızı — satın alma kapanır, kart soluklaşır |
| 1-5 | Son N adet | kehribar — hızlı nabız |
| 6+ | Stokta var | yeşil |

Eşik değeri `products.js` içindeki `STOCK_LOW_THRESHOLD` ile değişir.
Stok sıfırsa ürün sepete eklenemez ve karta otomatik "Tükendi" etiketi gelir;
sıfır değilse adet seçici stok adediyle sınırlanır.

### Teknik özellikler

Ürün sayfasında yalnızca **Boyut**, **Malzeme** ve **Baskı kalitesi** gösterilir.
Üçü de ürüne özeldir; boş bıraktığınız alan `DEFAULT_SPECS` değerine düşer.
Yeni ürün eklediğinizde bu üç alan varsayılanlarla dolu gelir.

## Ayarlar

| Ne | Nerede |
|---|---|
| WhatsApp sipariş numarası | `assets/js/store.js` → `WHATSAPP_NUMBER` |
| Figür görselleri (OpenMoji sürümü) | `assets/js/store.js` → `OPENMOJI_BASE` |
| Yazı tipleri | `assets/css/style.css` → `--font`, `--font-display` |
| Firma / yasal bilgiler | `assets/js/legal.js` → `COMPANY` |
| Kategori filtresi ikonları | `assets/js/products.js` → `CATEGORY_ICONS` |
| Etiket türleri ve renkleri | `assets/js/products.js` → `BADGES` |
| Varsayılan teknik özellikler | `assets/js/products.js` → `DEFAULT_SPECS` |
| Az stok eşiği | `assets/js/products.js` → `STOCK_LOW_THRESHOLD` |
| Görsel boyutu / kalitesi | `assets/js/cropper.js` → `MAX_EDGE`, `QUALITY` |
| Varlık sürümü (önbellek) | `index/detail/legal.html` → `?v=` |

## Yayına Almadan Önce

- [ ] `assets/js/legal.js` içindeki `COMPANY` nesnesini doldurun — köşeli parantezli
      alanlar (`[Şirket Ünvanı]`, `[MERSIS No]`, `[Vergi No]` …) tüm yasal metinlere yansır.
- [ ] Yasal metinleri bir hukuk danışmanına kontrol ettirin (şu an taslak).
- [ ] `legal-view.js` içindeki "Taslak metin" uyarısını kaldırın.
- [ ] Yasal sayfalara siteden bağlantı verin — mesafeli satış sözleşmesi, iade
      koşulları ve KVKK metninin satış öncesi erişilebilir olması mevzuat gereğidir.

## Sonraki Adımlar (birlikte planlanacak)

- Ödeme entegrasyonu (iyzico / PayTR / Stripe)
- İletişim / özel tasarım teklif formu
- İçerik yönetimi için backend veya headless CMS
- Alan adı + SSL + yayına alma
