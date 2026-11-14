/* ============================================================
   trtinyhands · Veri Katmanı
   ------------------------------------------------------------
   BU DOSYA ADMIN PANELİ TARAFINDAN ÜRETİLMİŞTİR (admin.html).
   Elle düzenleyebilirsiniz, ancak panelden yeni bir dışa aktarma
   yaptığınızda üzerine yazılır.

   Üretim tarihi: 15.11.2026 00:53:05
   Ürün sayısı:   7
   ============================================================ */

const PRODUCTS = [
  {
    id: "yeni-urun",
    title: "Puzzle",
    category: "Diğer",
    emoji: "🧩",
    image: null,
    price: 449,
    oldPrice: 650,
    rating: 4.8,
    reviews: 22,
    stock: 10,
    badges: [],
    size: "20 Cm x 20 Cm",
    material: "Problem çözme ve mantıksal düşünmeyi destekler.",
    layer: "+3 Yaş",
    desc: "Birlikte geçirilen kaliteli 15 dakika, ekran karşısında geçen saatlerden çok daha değerli. Aile bağlarını güçlendiren bu özel oyunumuz stoklarda! ✨",
  },
  {
    id: "yeni-urun-2",
    title: "Yeni Yıl Duyusal Oyun Materyali",
    category: "Diğer",
    emoji: "📦",
    image: null,
    price: 549,
    oldPrice: 600,
    rating: 4.6,
    reviews: 5,
    stock: 10,
    badges: ["yeni"],
    size: "20 cm x 20 cm",
    material: "Yeni yıl etkinliği",
    layer: "+3 Yaş",
    desc: "Çocukların dokunarak, arayarak ve kurgulayarak öğrenmesini destekleyen 17 Parçalık Yılbaşı Temalı Duyusal Oyun Seti ile tanışın! Kinetik kum, oyun hamuru, renkli pirinçler, nohut veya duyusal oyun tepsilerinin içine gizlenen minyatür parçalar, çocuklar için heyecan verici bir hazine avına dönüşüyor.",
  },
  {
    id: "yeni-urun-3",
    title: "Ses Dedektifi",
    category: "Diğer",
    emoji: "📦",
    image: null,
    price: 1199,
    oldPrice: 1500,
    rating: 5,
    reviews: 56,
    stock: 10,
    badges: ["yeni", "ozel-tasarim"],
    size: "20 cm x 15 cm",
    material: "Dil ve bilişsel becerilerini desteklemek için hazırlanmıştır.",
    layer: "+3 Yaş",
    desc: "Tamamen Kendi Tasarımımız Olan Çok Fonksiyonlu Eğitici Materyal ile Tanışın! Çocukların eğlenirken öğrenmesini sağlayan, uzmanlar ve ebeveynler tarafından özel olarak tasarlanmış bu eşsiz set, çocukların dil ve bilişsel becerilerini desteklemek için hazırlanmıştır.\n\nTamamen özgün üretimimiz olan bu set, çocukların dünyasına hitap eden yapısıyla öğrenme sürecini keyifli bir oyuna dönüştürür.\n\n134 parça",
  },
  {
    id: "drg-001",
    title: "Feeding  Monkey Toys",
    category: "Diğer",
    emoji: "🐒",
    image: null,
    price: 499,
    oldPrice: 749,
    rating: 4.9,
    reviews: 11,
    stock: 12,
    badges: [],
    size: "15 Cm x 15 Cm",
    material: "İnce motor gelişimini destekler.",
    layer: "2-6 yaş için uygundur",
    desc: "Çocuklar küçük kaslarını geliştirirken eğlenmenin en tatlı yolunu buldu! Ağzı açılan sevimli aslan ve maymun figürlerimizle oynamak sadece bir oyun değil; aynı zamanda;\n\nİnce Motor Becerileri: Nesneleri tutma, kavrama ve hedefe ulaştırma pratiği.\n\nEl-Göz Koordinasyonu: Hedefe odaklanarak nesneyi tam yerine atma yeteneği.\n\nHayal Gücü & Rol Oyunu: “Sevimli dostlarımızı besleme” temasıyla empati ve rol yapma becerisi.",
  },
  {
    id: "dno-002",
    title: "Kitchen Set",
    category: "Diğer",
    emoji: "🍎",
    image: null,
    price: 999,
    oldPrice: 1199,
    rating: 4.8,
    reviews: 56,
    stock: 7,
    badges: [],
    size: "16 cm",
    material: "Taklit etme ve oyun kurma sembolik oyun kurma becerisini güçlendirir.",
    layer: "+3 Yaş",
    desc: "Tiny Hands mutfak seti ile oyun saatleri daha lezzetli!  Çocukların taklit etme ve yaratıcı oyun kurma becerilerini destekleyen, her parçası özenle hazırlanmış bir mutfak deneyimi.",
  },
  {
    id: "rkt-003",
    title: "Feeding Leon Toys",
    category: "Diğer",
    emoji: "🦁",
    image: null,
    price: 499,
    oldPrice: 799,
    rating: 4.7,
    reviews: 42,
    stock: 3,
    badges: [],
    size: "15 Cm x 15 Cm",
    material: "Çocuk sağlığına uygun ve güvenli.",
    layer: "2-6 yaş için uygundur.",
    desc: "Çocukların “besleme” oyunlarına olan doğal merakını ince motor becerileriyle buluşturduk! Sevimli aslan figürü ile oynamak minikler için harika bir gelişim fırsatı.",
  },
  {
    id: "rbt-004",
    title: "Hospital Set",
    category: "Diğer",
    emoji: "📦",
    image: null,
    price: 549,
    oldPrice: 799,
    rating: 4.9,
    reviews: 15,
    stock: 24,
    badges: ["son-adet"],
    size: "15 cm",
    material: "Korku ve kaygılarını somutlaştırmalarını ve rollendirmelerini yardımcı olur.",
    layer: "+3Yaş",
    desc: "Kelimelerin yetmediği yerde, oyunun ve şefkatli dokunuşların rehberliğinde çocukların hikayelerine ortak olun.\n(doktor ve hasta dahil değildir)",
  },
];

/* Yeni ürün eklerken admin panelinde ön dolu gelen değerler. */
const DEFAULT_SPECS = {
  size: "15 cm",
  material: "PLA (mısır nişastası bazlı, çevre dostu)",
  layer: "0.1 mm katman kalınlığı",
};

/* Bu adede kadar "Son N adet" uyarısı gösterilir. */
const STOCK_LOW_THRESHOLD = 5;

/* Ürün etiketleri. */
const BADGES = {
  "cok-satan": { label: "Çok Satan", tone: "gold" },
  "yeni": { label: "Yeni", tone: "sage" },
  "son-adet": { label: "Son Adet", tone: "clay" },
  "ozel-tasarim": { label: "Özel Tasarım", tone: "lilac" },
  "el-boyama": { label: "Elde Boyandı", tone: "blush" },
};

/* Kategori filtresi figürleri. */
const CATEGORY_ICONS = {
  "Tümü": "✨",
  "Fantastik": "🦄",
  "Hayvanlar": "🐙",
  "Uzay": "🚀",
  "Robotlar": "🤖",
  "Araçlar": "🏎️",
};

const CATEGORIES = ["Tümü", ...new Set(PRODUCTS.map((p) => p.category))];
