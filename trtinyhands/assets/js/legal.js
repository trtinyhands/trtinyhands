/* ============================================================
   trtinyhands · Yasal Sayfalar (legal.js)
   URL: legal.html?page=<slug>
   ------------------------------------------------------------
   ÖNEMLİ: Aşağıdaki metinler TASLAKTIR. Yayına almadan önce
   [köşeli parantez] içindeki bilgileri doldurun ve bir hukuk
   danışmanına kontrol ettirin.
   ============================================================ */

/* Firma bilgileri — TEK YERDEN düzenleyin, tüm metinlere yansır. */
const COMPANY = {
  name: "[Şirket Ünvanı] (trtinyhands)",
  address: "[Açık Adres], İstanbul, Türkiye",
  email: "merhaba@trtinyhands.com",
  phone: "+90 500 000 00 00",
  mersis: "[MERSIS No]",
  taxOffice: "[Vergi Dairesi]",
  taxNo: "[Vergi No]",
  web: "www.trtinyhands.com",
};

const C = COMPANY;

const LEGAL_PAGES = [
  {
    slug: "mesafeli-satis",
    title: "Mesafeli Satış Sözleşmesi",
    body: `
      <h3>1. Taraflar</h3>
      <p><strong>Satıcı:</strong> ${C.name}<br>
      Adres: ${C.address}<br>
      E-posta: ${C.email} · Telefon: ${C.phone}<br>
      MERSIS: ${C.mersis} · Vergi Dairesi/No: ${C.taxOffice} / ${C.taxNo}</p>
      <p><strong>Alıcı:</strong> Sipariş sırasında beyan edilen ad, adres ve iletişim bilgilerine sahip müşteri.</p>

      <h3>2. Konu</h3>
      <p>İşbu sözleşmenin konusu, Alıcı'nın ${C.web} internet sitesi üzerinden elektronik ortamda sipariş verdiği ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>

      <h3>3. Sözleşme Konusu Ürün</h3>
      <p>Ürünün türü, miktarı, satış bedeli ve ödeme şekli, sipariş özetinde ve fatura üzerinde belirtildiği gibidir. Fiyatlara KDV dahildir.</p>

      <h3>4. Genel Hükümler</h3>
      <ul>
        <li>Alıcı, ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup onayladığını kabul eder.</li>
        <li>Sözleşme konusu ürün, yasal 30 günlük süreyi aşmamak kaydıyla, sipariş özetinde belirtilen hazırlık ve kargo süreleri içinde teslim edilir.</li>
        <li>Kişiye özel üretilen (ısmarlama) ürünlerde üretim, ödemenin ve tasarım onayının alınmasının ardından başlar.</li>
      </ul>

      <h3>5. Cayma Hakkı</h3>
      <p>Alıcı, malın teslim tarihinden itibaren <strong>14 gün</strong> içinde herhangi bir gerekçe göstermeksizin cayma hakkına sahiptir. Ancak Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi gereği, <strong>Alıcı'nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan kişiye özel ürünlerde cayma hakkı kullanılamaz.</strong> Ayrıntılar için İade & Değişim sayfamıza bakınız.</p>

      <h3>6. Uyuşmazlıkların Çözümü</h3>
      <p>İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı'nca ilan edilen parasal sınırlar dâhilinde Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
    `,
  },
  {
    slug: "iade",
    title: "İade, Değişim ve Cayma Hakkı",
    body: `
      <h3>Cayma Hakkı</h3>
      <p>Stok ürünlerde, ürünü teslim aldığınız tarihten itibaren <strong>14 gün</strong> içinde koşulsuz olarak iade edebilirsiniz. Cayma hakkını kullanmak için ${C.email} adresine sipariş numaranızla birlikte talep iletmeniz yeterlidir.</p>

      <h3>İade Koşulları</h3>
      <ul>
        <li>Ürün kullanılmamış, hasar görmemiş ve orijinal ambalajıyla birlikte olmalıdır.</li>
        <li>İade onaylandıktan sonra ürün bedeli, ödeme yönteminize <strong>14 gün</strong> içinde iade edilir.</li>
        <li>İade kargo süreci ve ücretine ilişkin bilgiler talebiniz sonrası tarafınıza iletilir.</li>
      </ul>

      <h3>Kişiye Özel Ürünler</h3>
      <p>Sizin talebiniz doğrultusunda özel olarak tasarlanıp üretilen (ısmarlama) ürünlerde yasal cayma hakkı bulunmamaktadır. Bu ürünlerde iade veya değişim yalnızca ürünün <strong>hatalı/hasarlı</strong> gelmesi durumunda geçerlidir.</p>

      <h3>Hasarlı veya Hatalı Ürün</h3>
      <p>Ürününüz hasarlı veya siparişinizden farklı geldiyse, teslimattan itibaren 48 saat içinde fotoğraflarıyla birlikte bize ulaşın. Değişim veya iade işlemini ücretsiz olarak gerçekleştirelim.</p>
    `,
  },
  {
    slug: "teslimat",
    title: "Teslimat ve Kargo",
    body: `
      <h3>Hazırlık ve Kargo Süresi</h3>
      <p>Stok ürünler 1-3 iş günü içinde kargoya verilir. Kişiye özel üretimlerde hazırlık süresi, tasarım onayının ardından genellikle 2-5 iş günüdür ve sipariş sırasında ayrıca bildirilir.</p>

      <h3>Kargo Ücreti</h3>
      <ul>
        <li><strong>2.500₺ ve üzeri</strong> siparişlerde kargo <strong>ücretsizdir.</strong></li>
        <li>Bu tutarın altındaki siparişlerde sabit kargo ücreti, ödeme adımında açıkça gösterilir.</li>
      </ul>

      <h3>Teslimat</h3>
      <p>Gönderiler anlaşmalı kargo firmaları aracılığıyla Türkiye'nin tüm illerine yapılır. Kargo takip numaranız, ürün kargoya verildiğinde e-posta/SMS ile paylaşılır.</p>

      <h3>Teslim Alırken</h3>
      <p>Paketinizi teslim alırken hasar olup olmadığını kontrol etmenizi öneririz. Hasarlı bir paket durumunda kargo görevlisine tutanak tutturarak ürünü teslim almayabilir veya durumu bize bildirebilirsiniz.</p>
    `,
  },
  {
    slug: "gizlilik",
    title: "Gizlilik Politikası",
    body: `
      <h3>Genel</h3>
      <p>${C.name} olarak gizliliğinize önem veriyoruz. Bu politika, ${C.web} üzerinden topladığımız bilgilerin nasıl kullanıldığını açıklar.</p>

      <h3>Toplanan Bilgiler</h3>
      <ul>
        <li>Sipariş ve iletişim için verdiğiniz ad, adres, e-posta ve telefon bilgileri.</li>
        <li>Site kullanımına ilişkin teknik veriler (çerezler aracılığıyla — bkz. Çerez Politikası).</li>
      </ul>
      <p>Ödeme kartı bilgileriniz tarafımızca <strong>saklanmaz</strong>; ödemeler lisanslı ödeme kuruluşlarının güvenli altyapısı üzerinden gerçekleştirilir.</p>

      <h3>Bilgilerin Kullanımı</h3>
      <p>Bilgileriniz yalnızca siparişinizin işlenmesi, teslimatı, müşteri desteği ve (onayınızla) kampanya bildirimleri için kullanılır. Bilgileriniz, hizmetin gerektirdiği haller (kargo, ödeme) dışında üçüncü taraflarla paylaşılmaz ve satılmaz.</p>

      <h3>Güvenlik</h3>
      <p>Verileriniz SSL şifreleme ve uygun teknik/idari tedbirlerle korunur.</p>

      <h3>İletişim</h3>
      <p>Gizlilikle ilgili sorularınız için: ${C.email}</p>
    `,
  },
  {
    slug: "kvkk",
    title: "KVKK Aydınlatma Metni",
    body: `
      <h3>Veri Sorumlusu</h3>
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla ${C.name} tarafından aşağıda açıklanan kapsamda işlenmektedir.<br>
      Adres: ${C.address} · E-posta: ${C.email}</p>

      <h3>İşlenen Veriler ve Amaçları</h3>
      <p>Kimlik, iletişim ve sipariş verileriniz; sözleşmenin kurulması ve ifası, ürün teslimi, faturalandırma, müşteri ilişkileri yönetimi ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenir.</p>

      <h3>Aktarım</h3>
      <p>Verileriniz; kargo firmaları, ödeme kuruluşları ve yasal olarak yetkili kamu kurumları ile sınırlı olarak, amaçla bağlantılı şekilde paylaşılabilir.</p>

      <h3>KVKK m.11 Kapsamındaki Haklarınız</h3>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
        <li>Eksik/yanlış işlenmişse düzeltilmesini isteme,</li>
        <li>Şartları oluştuğunda silinmesini/yok edilmesini isteme,</li>
        <li>İşlemenin hukuka aykırılığı nedeniyle zarara uğramanız hâlinde giderim talep etme.</li>
      </ul>
      <p>Bu haklarınızı kullanmak için taleplerinizi ${C.email} adresine iletebilirsiniz.</p>
    `,
  },
  {
    slug: "cerez",
    title: "Çerez (Cookie) Politikası",
    body: `
      <h3>Çerez Nedir?</h3>
      <p>Çerezler, ziyaret ettiğiniz web sitelerinin cihazınıza kaydettiği küçük metin dosyalarıdır. Siteyi daha işlevsel hâle getirmek için kullanılırlar.</p>

      <h3>Kullandığımız Çerezler</h3>
      <ul>
        <li><strong>Zorunlu çerezler:</strong> Sepetinizin ve temel işlevlerin çalışması için gereklidir (örn. sepet bilgisinin tarayıcınızda saklanması).</li>
        <li><strong>Performans/analitik çerezler:</strong> Sitenin nasıl kullanıldığını anlamak için (onayınıza tabidir).</li>
      </ul>

      <h3>Çerezleri Yönetme</h3>
      <p>Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezlerin engellenmesi, sepet gibi bazı işlevlerin çalışmamasına yol açabilir.</p>
    `,
  },
];
