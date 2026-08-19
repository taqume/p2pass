# P2Pass

[Türkçe](README.md) | [English](README.en.md)

> Aracısız. Biletin senin. Ödemen senin. İtibarın senin.

P2Pass; etkinlik yayınlama, bilet edinme, ödeme, katılım doğrulama ve etkinlik sonrası itibarı aynı on-chain akışta birleştiren bir Base Sepolia uygulamasıdır. Cüzdan kullanıcı kimliği, soulbound pass bilet, kontrat kayıtları ise ortak doğrulama katmanı olarak kullanılır.

Uygulamanın API sunucusu, veritabanı veya yetkili bir backend servisi yoktur. Etkinlikler, pass sahipliği, ödemeler, katılım, profiller ve yorumlar yapılandırılmış kontratlardan okunur. Kontratlar erişilemediğinde arayüz örnek veya mock veri göstermez.

## Sorun

Geleneksel etkinlik platformlarında etkinliği yayınlayan taraf ile katılımcı arasındaki kayıt, ödeme ve erişim ilişkisi platform tarafından tutulur. Bunun sonucunda:

- Bilet sahipliği platform hesabına bağlı kalır ve bağımsız doğrulanamaz.
- Organizatörün geliri ve ödeme zamanı platform kurallarına bağlıdır.
- Katılım geçmişi platform dışında ortak bir kanıt olarak kullanılamaz.
- Yorumların gerçekten katılan kişilerden geldiği doğrulanamaz.
- Platform veya hesap erişimi kaybolduğunda geçmiş de kaybolabilir.

## Çözüm

P2Pass, platformun tuttuğu yetkili kaydı üç modüler kontrata dağıtır:

- `P2PassCore` etkinlikleri, kayıtları, native ETH escrow'unu, iadeleri, tarayıcı yetkilerini ve katılımı yönetir.
- `EventPass` her etkinlik için transfer edilemeyen bir ERC-1155 pass üretir.
- `P2PassReputation` cüzdan profillerini, etkinlik yorumlarını ve ortak katılımla doğrulanan kişi yorumlarını saklar.

Frontend bu kontratları wagmi ve viem üzerinden doğrudan okur. Yazma işlemleri kullanıcının cüzdanında açıkça onaylanır. QR kodu bir sır veya yetki taşımaz; yalnızca etkinlik ile katılımcıyı tanımlar. Nihai yetki kontrolü kontratta yapılır.

## Temel akış

```text
Organizatör etkinlik oluşturur
          |
          v
Katılımcı ücretsiz veya ücretli pass alır
          |
          v
Ücret P2PassCore escrow'unda tutulur
          |
          v
Organizatör veya yetkili tarayıcı QR ile check-in yapar
          |
          v
Katılım on-chain olarak doğrulanır
          |
          +------> Etkinlik yorumu açılır
          |
          +------> Ortak katılımcılar birbirini değerlendirebilir
          |
          v
Etkinlik sonunda organizatör geliri çeker
```

## Kontrat mimarisi

### P2PassCore

Etkinlik yaşam döngüsünün yetkili kaynağıdır.

#### Etkinlik oluşturma

Bir etkinlik oluşturulabilmesi için etkinlik adı boş olmamalı, başlangıç gelecekte olmalı, bitiş başlangıçtan sonra gelmeli ve gönderilen ETH kontratın o anki `creationFee` değeriyle tam eşleşmelidir. İşlemi gönderen cüzdan organizatör olur. `0` kapasite sınırsız kapasite anlamına gelir.

#### Etkinliği düzenleme

Yalnızca organizatör düzenleme yapabilir. Etkinlik iptal edilmemiş ve henüz başlamamış olmalıdır. Yeni zaman aralığı da geçerli ve gelecekte olmalıdır.

- Kapasite kayıtlı katılımcı sayısının altına indirilemez.
- İlk pass alındıktan sonra bilet fiyatı değiştirilemez.
- İsim, açıklama, konum, görsel URI, zaman ve uygun kapasite güncellenebilir.

#### Pass alma ve ödeme

Katılımcının pass alabilmesi için etkinlik iptal edilmemiş ve başlamamış olmalı, cüzdan aynı pass'e daha önce sahip olmamalı, kapasite dolmamış olmalı ve gönderilen ETH etkinlik fiyatıyla tam eşleşmelidir.

Ücretsiz etkinliklerde değer `0` olmalıdır. Ücretli etkinliklerde ödeme wei hassasiyeti korunarak gönderilir ve etkinlik sonuçlanana kadar Core kontratında escrow olarak tutulur. Organizatörün kendi etkinliğinden pass almasını engelleyen bir kural yoktur.

#### Check-in ve tarayıcı yetkisi

Check-in yalnızca etkinliğin başlangıç ve bitiş zamanı arasında yapılabilir. İşlemi etkinlik organizatörü veya o etkinlik için yetkilendirilmiş tarayıcı cüzdanı göndermelidir. Hedef cüzdan pass sahibi olmalı ve daha önce check-in yapmamış olmalıdır.

Başarılı işlem `attended[eventId][participant]` durumunu kalıcı olarak `true` yapar. Tarayıcı yetkisi organizatör tarafından verilebilir ve kaldırılabilir.

#### İptal, iade ve gelir çekme

- Organizatör sonuçlandırılmamış etkinliği iptal edebilir.
- İptal edilen ücretli etkinlikte her katılımcı kendi ödemesini `claimRefund` ile çeker.
- Pull-refund modeli katılımcılar üzerinde döngü kurmaz ve toplu ödeme gas riskini önler.
- İptal edilmemiş etkinliğin geliri yalnızca bitişten sonra ve bir kez çekilebilir.
- Brüt gelirin yüzde 2'si protokol ücreti olarak ayrılır, kalanı organizatöre gönderilir.

Pass soulbound olduğu için transfer edilemez. İptal ve iade pass'i yakmaz; ödeme kaydı sıfırlanır ve etkinliğin iptal durumu pass'in kullanılmasını engeller.

### EventPass

EventPass bir ERC-1155 kontratıdır. Her `eventId` aynı zamanda token kimliğidir ve bir cüzdan bir etkinlikten en fazla bir pass alabilir.

- Pass yalnızca `P2PassCore` tarafından basılabilir.
- Cüzdanlar arasında transfer devre dışıdır.
- Pass satılamaz veya başka hesaba taşınamaz.
- Metadata URI'si kontrat yöneticisi tarafından güncellenebilir.

### P2PassReputation

Profil ve itibar verilerini cüzdan adresiyle ilişkilendirir.

#### Profil

| Alan | On-chain sınır |
| --- | ---: |
| Username | 64 byte |
| Görünen ad | 96 byte |
| Biyografi | 500 byte |
| Avatar URI | 256 byte |
| Web veya sosyal bağlantı | 256 byte |

Username değerleri kontrat seviyesinde benzersiz değildir. Aynı username'i kullanan birden fazla cüzdan bulunabilir. Frontend username ve görünen ad aramasını `ProfileUpdated` loglarından, cüzdan adresi aramasını doğrudan adres üzerinden yapar.

#### Etkinlik yorumu

- Puan `1–5` arasında olmalıdır.
- Yorum en fazla 500 byte olabilir.
- Yorum yapan cüzdanın ilgili etkinlikte on-chain check-in kaydı bulunmalıdır.
- Aynı cüzdan yorumunu güncelleyebilir; toplam puan düzeltilir ve yorum sayısı ikinci kez artırılmaz.

#### Kişi yorumu

- Kullanıcı kendisini değerlendiremez.
- Yorum yapan ve hedef cüzdan aynı kanıt etkinliğinde check-in yapmış olmalıdır.
- Puan ve yorum sınırları etkinlik yorumuyla aynıdır.
- Güncelleme mevcut değerlendirmeyi değiştirir; kopya değerlendirme oluşturmaz.

## Frontend yapısı

Frontend Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, wagmi ve viem ile geliştirilmiştir.

### Sayfalar

| Rota | Görev |
| --- | --- |
| `/` | Motto, problem ve çözümü üç scroll-snap sahnede anlatır. |
| `/events` | On-chain etkinlikleri listeler, sıralar, arar ve filtreler. |
| `/events/[id]` | Etkinlik ayrıntısı, pass alma, iade ve doğrulanmış yorumları gösterir. |
| `/passes` | Bağlı cüzdanın pass'lerini ve check-in QR kodlarını gösterir. |
| `/organize` | Etkinlikleri, katılımcıları, tarayıcı yetkisini ve settlement işlemlerini yönetir. |
| `/create` | Yeni etkinlik oluşturma işlemini hazırlar ve cüzdana gönderir. |
| `/events/[id]/edit` | Başlamamış etkinliğin izin verilen alanlarını günceller. |
| `/profile/[address]` | Cüzdan profili, pass geçmişi, katılım ve kişi yorumlarını gösterir. |
| `/scan` | QR veya manuel veriyle pass ve tarayıcı yetkisini kontrol edip check-in gönderir. |

### Etkinlik keşfi

- Yaklaşan ve devam eden etkinlikler en yakın başlangıç tarihinden en uzağa sıralanır.
- Bitmiş etkinlikler listenin altında soluk gösterilir ve filtreyle gizlenebilir.
- Metin araması ad, açıklama ve konum üzerinde çalışır.
- Ücretsiz ve ücretli etkinlikler filtrelenebilir.
- İptal edilmiş etkinlikler herkese açık keşif listesinden çıkarılır.

### Cüzdan, ağ, dil ve tema

- Uygulama Base Sepolia zincir kimliği `84532` ile çalışır.
- Yanlış ağdaki cüzdana Base Sepolia'ya geçiş seçeneği sunulur.
- Okumalar birincil ve yedek RPC transport'ları üzerinden yapılır.
- Yazmalar bağlı cüzdan tarafından imzalanır ve cüzdan sağlayıcısı üzerinden yayınlanır.
- Custom error değerleri Türkçe ve İngilizce anlaşılır mesajlara çevrilir.
- Arayüz Türkçe/İngilizce ve açık/koyu tema destekler.

Header araması tam cüzdan adresiyle doğrudan profile gider. Username ve görünen ad araması Reputation deployment bloğundan sonraki profil loglarını tarar. Bunun için `NEXT_PUBLIC_REPUTATION_DEPLOYMENT_BLOCK` doğru olmalıdır.

## QR güven modeli

Pass QR formatı:

```text
p2pass:84532:<eventId>:<participantAddress>
```

QR içinde private key, imza, session veya tekrar kullanılabilir sır yoktur. QR'ı görmek check-in yetkisi vermez. Tarayıcı işlem düğmesini açmadan önce şunları zincirden kontrol eder:

1. Payload Base Sepolia formatında mı?
2. Etkinlik var mı ve iptal edilmemiş mi?
3. Katılımcı pass sahibi mi?
4. Etkinlik zamanı açık mı?
5. Katılımcı daha önce check-in yaptı mı?
6. Bağlı cüzdan organizatör veya yetkili tarayıcı mı?

Görevli QR okunduktan sonra işlemi cüzdanında ayrıca onaylar. Katılım ancak işlem blokta onaylandıktan sonra işaretlenir.

## Repository yapısı

```text
web/
  src/app/                         Next.js rotaları
  src/components/                  Etkinlik, pass, profil, QR ve işlem bileşenleri
  src/lib/contracts.ts             Adresler ve typed ABI tanımları
  src/lib/contract-errors.ts       Okunabilir kontrat hata mesajları
  src/lib/qr.ts                    QR üretme ve doğrulama

contracts/
  src/P2PassCore.sol               Etkinlik, escrow ve katılım
  src/EventPass.sol                Soulbound ERC-1155 pass
  src/P2PassReputation.sol         Profil ve doğrulanmış yorumlar
  test/P2Pass.t.sol                Yaşam döngüsü ve yetki testleri
  script/Deploy.s.sol              Deployment sırası ve rol bağlantıları
```

## Mevcut Base Sepolia deployment

| Kontrat | Adres |
| --- | --- |
| EventPass | [`0x58120647e754f025d77AA5c20CEc0683C5b30865`](https://sepolia.basescan.org/address/0x58120647e754f025d77AA5c20CEc0683C5b30865) |
| P2PassCore | [`0x493e4afeCDa445076f5F21FCe672fb76f117dC13`](https://sepolia.basescan.org/address/0x493e4afeCDa445076f5F21FCe672fb76f117dC13) |
| P2PassReputation | [`0xCAD812B1Fc51764043789d896e369c085A80F392`](https://sepolia.basescan.org/address/0xCAD812B1Fc51764043789d896e369c085A80F392) |

Kontrat kaynak kodu değişmedikçe frontend değişiklikleri için yeniden deployment gerekmez. Frontend ABI'sine event veya custom error eklemek on-chain bytecode'u değiştirmez.

## Yerel çalıştırma

### Gereksinimler

- Node.js 20 veya üzeri
- npm
- Foundry (`forge`, `cast`)
- MetaMask veya EIP-1193 uyumlu cüzdan
- Yazma işlemleri için Base Sepolia ETH

### Bağımlılıklar

```bash
npm install --prefix web
cd contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts@v5.2.0 --no-git
cd ..
```

### Frontend ortamı

```bash
cp web/.env.example web/.env.local
```

Mevcut deployment ile çalışmak için:

```dotenv
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=0x493e4afeCDa445076f5F21FCe672fb76f117dC13
NEXT_PUBLIC_PASS_CONTRACT_ADDRESS=0x58120647e754f025d77AA5c20CEc0683C5b30865
NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS=0xCAD812B1Fc51764043789d896e369c085A80F392
NEXT_PUBLIC_REPUTATION_DEPLOYMENT_BLOCK=45651673
```

Public RPC'ler rate-limited olabilir. Frontend PublicNode ile Base public RPC arasında fallback kullanır. Cüzdan yazmaları için MetaMask ağ ayarındaki RPC'nin de çalışması gerekir.

### Geliştirme sunucusu

```bash
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde açılır.

### Test ve build

```bash
npm test
```

Bu komut Foundry kontrat testlerini, Vitest testlerini, ESLint'i ve optimize Next.js production build'ini çalıştırır.

Tekil komutlar:

```bash
npm run test:contracts
npm run test:web
npm run lint
npm run build
```

Production build'i yerelde çalıştırmak için:

```bash
npm run build
npm --prefix web run start
```

## Yeni kontrat deployment'ı

Bu bölüm yalnızca Solidity kaynakları değiştiğinde veya ayrı deployment istendiğinde gereklidir.

```bash
cp contracts/.env.example contracts/.env
```

```dotenv
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=0x...
BASESCAN_API_KEY=
EVENT_CREATION_FEE_WEI=200000000000000
PASS_METADATA_URI=ipfs://YOUR_CID/{id}.json
```

Private key testnet için olsa bile commit edilmemeli veya paylaşılmamalıdır. Deployer cüzdanında gas için Base Sepolia ETH bulunmalıdır.

```bash
set -a
source contracts/.env
set +a

cd contracts
forge script script/Deploy.s.sol:DeployP2Pass \
  --rpc-url base_sepolia \
  --broadcast
cd ..
```

`BASESCAN_API_KEY` tanımlandıktan sonra kaynak doğrulaması için `--verify` eklenebilir.

Deployment sırası:

1. `EventPass`
2. `P2PassCore`
3. Core'a `MINTER_ROLE` verilmesi
4. Core adresine immutable olarak bağlı `P2PassReputation`

Komutun yazdırdığı adresler frontend ortamına aktarılmalı, Reputation deployment blok numarası `NEXT_PUBLIC_REPUTATION_DEPLOYMENT_BLOCK` olarak eklenmeli ve frontend yeniden build edilmelidir.

## Vercel deployment

Vercel proje kökü `web` olarak ayarlanabilir veya root npm scriptleri kullanılabilir. Project Settings altında şu değişkenler tanımlanmalıdır:

```text
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS
NEXT_PUBLIC_PASS_CONTRACT_ADDRESS
NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS
NEXT_PUBLIC_REPUTATION_DEPLOYMENT_BLOCK
```

`NEXT_PUBLIC_` değerleri build sırasında frontend bundle'ına yazıldığı için değişiklikten sonra yeniden deployment gerekir. Frontend veya Vercel ortamına private key eklenmez.

## Sınırlar ve güven varsayımları

- Mevcut deployment Base Sepolia testnet içindir; gerçek değer taşıyan production sistemi değildir.
- Kontratlar otomatik testlerden geçer ancak bağımsız güvenlik denetimi yapılmış değildir.
- Username benzersizliği kontrat tarafından zorlanmaz.
- Görseller yüklenmez; yalnızca URI değerleri saklanır.
- Public RPC servisleri geçici rate-limit veya `503` hatası verebilir.
- Frontend cüzdan onayı olmadan işlem gönderemez.
- QR verisi açıktır; güvenlik sınırı kontrattaki pass, zaman ve tarayıcı yetkisi kontrolleridir.

## Lisans

Bu repository [MIT License](LICENSE) ile lisanslanmıştır.
