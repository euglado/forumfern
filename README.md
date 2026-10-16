# ForumFern

[Türkçe](#türkçe) · [English](#english) · [Privacy](PRIVACY.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md)

## Türkçe

### Amaç

ForumFern, Discord topluluklarında üyelerin bir forumda paylaşım yapmadan önce **etiketleri ve yönergeyi özel bir panelde** incelemesini sağlayan gerçek bir Discord botudur. Etkinlik, gönüllülük, oyun, yazılım veya çalışma forumlarında yeni üyelere yön bulmada yardımcı olur. `/forumfern` komutu ve tıklanabilir Etiketler / Yönerge / Yenile / Kapat düğmeleri vardır. Kaynak kodunu yayımlamak botu çalıştırmaz: kendi Discord uygulamanız, bot tokenınız ve sürekli açık bir bilgisayar veya barındırma hizmeti gerekir.

### Özellikler ve sınırlar

- Seçtiğiniz erişilebilir **normal forumun** en fazla 20 etiketini, moderatör etiketlerini ve etiket zorunluluğunu gösterir.
- Yeni gönderi yavaş modu ve yeni gönderilerdeki varsayılan yanıt yavaş modunu saniye olarak açıklar. İzin muafiyetleri olabilir; mevcut gönderilerin yanıt yavaş modunu ölçmez.
- Yönergenin ilk 1.400 UTF-16 kod birimini düz metin olarak gösterir. Uzunsa `…` ekler; tam yönergeyi Discord'da forumun kendisinden okuyun. Bot yönergeyi yorumlamaz veya özetlemez.
- İlk panel ve her Etiketler/Yönerge/Yenile tıklaması sunucu, roller, istek sahibi, bot üyeliği ve forumu REST API'den yeniden okur. Botun ve üyenin View Channel izinlerini rol/üye üzerine yazmalarıyla kontrol eder. API okumaları aynı anda gerçekleşen tek bir işlem değildir; izin değişikliğiyle yarış olabilir.
- Türkçe/İngilizce: Discord diliniz Türkçeyse Türkçe; aksi halde İngilizce. `language` seçeneğiyle değiştirilebilir.
- Mesajları/gönderileri okumaz; gönderi oluşturmaz, kanal/rol/etiket değiştirmez, DM veya public rapor göndermez. Arama, otomatik etiketleme, moderasyon, çeviri veya paylaşabilme garantisi sağlamaz.
- Yaş kısıtlı, spoiler veya obfuscated olarak işaretlenmiş forumlar ve medya kanalları desteklenmez. Botta Administrator/Yönetici varsa rapor reddedilir.
- Etiket adındaki emoji nesneleri gösterilmez; etiketin metin adı kullanılır. Ping, Markdown ve bağlantı çalıştırmamak için metin kod bloğunda gösterilir; backtick ve `@` karakterleri görsel eşdeğerleriyle değiştirilir, kontrol/bidi karakterleri temizlenir. Bu nedenle panel tam metin yedeği değildir.

### Gereksinimler

- Windows, macOS veya Linux; **Node.js 24.13 veya daha yeni bir 24.x sürümü**, beraberindeki npm ve internet. Node 25/26 bu sürümün destek aralığında değildir.
- Yönettiğiniz bir Discord sunucusu ve sunucuya uygulama ekleme izni. Forumların bulunduğu bir sunucu gerekir; bot forum oluşturmaz.
- Kendi Discord uygulamanız ve bot tokenınız. Her kurulum tek sunucu ve tek çalışan bot süreci içindir. Veri tabanı, ücretli AI API veya web sunucusu gerekmez.

### Kurulum: kod düzenlemeden

1. [Discord Developer Portal](https://discord.com/developers/applications) sayfasında **New Application** ile bir uygulama oluşturun. General Information bölümündeki **Application ID** değerini alın; bu token değildir.
2. **Bot** bölümünde botu oluşturun veya mevcut botu kullanın. Tokenı **Reset Token** ile alın. Tokenı mesaj, ekran görüntüsü, issue, Git veya üçüncü taraf kurulum sitesiyle paylaşmayın. Portalda **Presence, Server Members ve Message Content** ayrıcalıklı intents seçeneklerini **kapalı** bırakın. Bot yalnızca Guilds intent kullanır.
3. **Installation** bölümünde **Guild Install** kullanın, User Install açmanız gerekmez. Scopes: `bot` ve `applications.commands`. Bot izinleri: yalnızca **View Channels** (izin sayısı `1024`). Install bağlantısıyla kendi sunucunuza ekleyin. Administrator, Manage Channels, Manage Threads, Send Messages ve Read Message History istemeyin.
4. Discord **User Settings → Advanced → Developer Mode** seçeneğini açın. Sunucu simgesine sağ tıklayıp **Copy Server ID** alın. Application ID ve Server ID farklı değerlerdir.
5. GitHub'da **Code → Download ZIP** seçin, ZIP'i normal bir klasöre çıkarın. Token klasörünü paylaşılan/cloud-senkronize bir klasörde tutmayın. [Node.js resmi indirme](https://nodejs.org/en/download) sayfasından desteklenen Node 24 sürümünü kurun. `node --version` ve `npm --version` çalışmalı.
6. Çıkarılan klasörde terminal açın. Windows'ta `setup.cmd`; macOS/Linux'ta `bash setup.sh` çalıştırın. Yardımcı dosya bağımlılıkları kilitli sürümlerle `npm ci --ignore-scripts` kullanarak kurar. Alternatif komutlar:

   ```text
   npm ci --ignore-scripts
   npm run setup
   ```

7. Application ID, Server ID ve **yalnızca bot tokenını** girin. Token girişinde karakterler görünmez; bu normaldir. Satır sonu içeren yapıştırmalar reddedilir; tokenı seçip kopyalayın, terminalde yapıştırın ve ardından Enter'a basın. Ctrl+C iptal eder. Etkileşimli bir terminal gerekir; girdiyi başka dosyadan yönlendirmeyin.
8. Yardımcı program `.env` dosyasını oluşturur; mevcut dosyayı okumaz veya üzerine yazmaz. Kaynak kod düzenlemeniz gerekmez. POSIX sistemlerde yeni dosya `0600` izinleriyle oluşturulur; Windows'ta klasör erişimini kendi hesabınızla sınırlayın.
9. Windows'ta `register.cmd`, macOS/Linux'ta `bash register.sh`; ardından `start.cmd` veya `bash start.sh` çalıştırın. Terminal karşılıkları `npm run register` ve `npm start`. Kayıt işlemi yalnızca bu uygulamanın bu sunucudaki `/forumfern` komutunu ekler/günceller; diğer komutları topluca silmez. Komut seçenekleri değişince kaydı tekrar çalıştırın.
10. Terminalde **ForumFern bağlandı** mesajını görün. Discord'da komutları kullanabileceğiniz bir kanala gidip `/forumfern` yazın, `forum` alanından forumu seçin. `language: Türkçe` isteğe bağlıdır. Panelin yalnızca size göründüğünü kontrol edin.

### Yapılandırma ve izinler

Kurulum üç gizli/yerel ortam değişkenini oluşturur: `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID`. Son ikisi kimliktir, parola değildir; token paroladır. Barındırma ortamınız secret/env arayüzü sağlıyorsa aynı adları kullanın; `.env` zorunlu değildir. Ortam değişkenleri `.env` değerlerinden önceliklidir. Bot bu sunucu dışındaki etkileşimleri reddeder; aynı uygulamayı başka sunuculara kurmayın.

Botun seçilen forumda View Channel izni olmalı; kategori/kanal üzerine yazmaları bunu engelleyebilir. Üyenin de forumu görüntüleme izni olmalı. Komutu çağırmak için Discord'da **Use Application Commands** izni gerekir; bu botun istemesi gereken ek bir bot izni değildir. Panel etkileşim yanıtı olarak özeldir; normal kanala mesaj atılmaz. Üyenin Administrator izni raporu engellemez; botunki engeller. Moderatör etiketi, Discord'a göre Manage Threads gerektiren etikettir; bot bu izni istemez ve etiket uygulamaz.

### Kullanım

`/forumfern forum:atölye language:Türkçe` ile özel önizleme açın. **Etiketler** tüm etiket adlarını ve ayarları; **Yönerge** kısa düz metin yönergeyi gösterir. **Yenile** geçerli sayfayı yeniden okur. Her okuma öncesinde erişim yeniden doğrulanır. **Kapat** panel metnini değiştirip düğmeleri ve RAM oturumunu kaldırır; bu işlem API'den forum okuması yapmaz.

Paneller 5 dakika sonra geçersiz olur; süre tıklamalarla uzamaz. Komutlar sunucu/üye başına ve düğmeler panel başına 5 saniye aralıklıdır. En fazla 100 panel, 50 eşzamanlı işlem ve 1.000 kısa bekleme kaydı tutulur. Bunlar yoğun kullanımda kısıtlamadır; birkaç saniye sonra veya eski panellerin süresi dolunca tekrar deneyin. Yeniden başlatınca tüm paneller geçersizleşir. Zaman aşımında veya yeniden başlatmada Discord'daki **eski özel metin/düğmeler otomatik silinmeyebilir**; görüntü anlık bir kayıttır, erişim iptali geçmişte görülmüş bilgiyi geri almaz.

### Botu çalışır tutma

`npm start` açık kaldığı ve ağ bağlı olduğu sürece bot çalışır. Bilgisayarın uyuması, terminalin kapanması veya hizmetin durması botu çevrimdışı bırakır. Sürekli kullanım için Node 24 destekleyen, sırları koruyan ve tek kalıcı süreç çalıştırabilen bir hizmet kullanın. Otomatik yeniden başlatma ve log saklama ayarlarını barındırıcınızın belgeleriyle yapın. Aynı tokenla ikinci kopya açmayın. Bu depo bir VDS servisi kurmaz; üretim servisini değiştirmez. Durdurmak için Ctrl+C kullanın. Güncellemeden önce botu durdurun, yeni kaynakları alın, `.env` dosyanızı özel tutun, `npm ci --ignore-scripts` çalıştırın, gerekirse komutu kaydedin ve yeniden başlatın.

### Güvenlik ve gizlilik

Token yalnızca yerel `.env` veya sağlayıcının secret alanında tutulur; `.gitignore` ortam dosyalarını dışlar. Token sızdıysa önce Portal'da Reset Token yapın. Yeni değerle yeniden kurmak için eski `.env` dosyasını güvenli biçimde başka yere taşıyın ve `npm run setup` çalıştırın; eski dosyayı paylaşmayın. Proje kendi analitiğini/veri tabanını kullanmaz. RAM oturumları kullanıcı, sunucu, çağrı kanalı, uygulama, hedef forum ve özel yanıt kimliklerini; dil, sayfa, süre ve işlem durumunu tutar. Forum metni oturum deposunda tutulmaz; REST yanıtı işlenirken geçici RAM'dedir. Bekleme kayıtları yaklaşık 5 saniyedir; süresi dolan kayıtlar 30 saniyelik temizleme turunda veya sonraki etkileşimde kaldırılır. SDK, Guilds bağlantısı nedeniyle sunucu/rol/kanal metadata önbellekleri kullanır; mesaj/üye/kullanıcı cache limitleri sıfırdır. Discord ve barındırma sağlayıcınızın kendi veri işleme kuralları geçerlidir. Ayrıntılar [PRIVACY.md](PRIVACY.md).

### Sorun giderme

- **npm/node bulunamadı:** Node 24 kurulumundan sonra yeni terminal açın. PowerShell `npm.ps1` engelliyorsa `.cmd` yardımcılarını veya `npm.cmd` kullanın; sistem güvenlik ayarını değiştirmeniz gerekmez.
- **Komut görünmüyor:** doğru sunucuya kurulumu, `applications.commands` scope'unu, `npm run register` sonucunu ve Use Application Commands izninizi kontrol edin. Discord'u yenileyin. Bot açık olmalıdır.
- **Forum seçilemiyor:** bu bot yalnızca normal Forum kanalını destekler; metin kanalı, forum gönderisi (thread) veya Media seçmeyin. Komutu başka bir erişilebilir metin kanalından çağırabilirsiniz.
- **Forum kullanılamıyor:** bot/üye View Channel erişimini ve kanal üzerine yazmalarını kontrol edin. Botun tüm rollerinden Administrator iznini kaldırın. Yaş kısıtlı/spoiler forumlar reddedilir. Ağ/Discord 429 veya 5xx hatasında daha sonra tekrar deneyin; ham API hatası veya token gösterilmez.
- **Panel süresi doldu/meşgul:** 5 saniye bekleyin veya yeni `/forumfern` paneli açın. Eski panel yeniden başlatmadan sonra çalışmaz. Tüm kapasiteler anlık RAM sınırlarıdır.
- **Token girişi görünmüyor:** giriş gizlidir. IDE'nin çıktı penceresi yerine gerçek terminal kullanın. `.env zaten var` mesajında dosyayı özel yedekleyip yeniden kurun; yardımcının üzerine yazması beklenmez.
- **Yönerge eksik veya farklı görünüyor:** panel uzun metni keser ve bazı karakterleri güvenli görüntüleme için değiştirir. Tam yönergeyi forumda okuyun. Ekran okuyucu/mobil görünümü kendi istemcinizde doğrulayın.

### Testler ve doğrulama

Geliştirme kontrolleri gizli dosya bulunmayan bir kaynak kopyasında çalıştırılır:

```text
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/verify.mjs
bash -n setup.sh register.sh start.sh
```

`check`: önerilen Biome lint/format, strict TypeScript (bağımlılık tipleri dahil), Node testleri ve kilit dosyası lisans/registry/SHA-512/install-script ile kaynak credential-pattern taramasıdır. Tarama bilinen desenleri yakalar; tüm sırları veya güvenlik açıklarını bulma garantisi vermez. Yerel `.env` varsa supply kontrolü bilinçli olarak durur; canlı tokenı testlere vermeyin. Bash sözdizimi kontrolü Windows CI'da Git Bash kullanır.

Testler izin üzerine yazmaları için 512 kombinasyonu, erişim kaybını, özel panel bağlarını, zaman aşımını, kapasite/eşzamanlılık sınırlarını, bozuk girdileri, Unicode sınırlarını ve gizli terminal girişini kapsar. Discord REST ve etkileşim taşıması sahte nesnelerle test edilir; yapılandırılmamış gerçek giriş noktaları ayrı geçici klasörlerde çalıştırılır. **Canlı Discord tokenı/sunucusu veya VDS ile test yapılmadı.** İlk gerçek kurulum, istemci düğmeleri, gerçek terminalde token girişi, mobil/ekran okuyucu ve sürekli barındırma operatör doğrulaması gerektirir. CI, Ubuntu/Windows/macOS 15 Intel'de aynı otomatik kontrolleri çalıştırır.

### Katkı ve lisans

Kurulum/erişilebilirlik geri bildirimleri ve testli küçük düzeltmeler için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını okuyun. Issue/PR içine token, özel forum yönergesi veya üye verisi koymayın. Güvenlik bildirimleri için [SECURITY.md](SECURITY.md). Kod [MIT](LICENSE) lisanslıdır; bağımlılıkların kendi lisansları geçerlidir.

## English

### Purpose

ForumFern is a real Discord bot that helps community members **privately inspect a forum's tags and guidelines before posting**. It suits workshop, volunteer, gaming, software and study forums. `/forumfern` opens a preview with Tags / Guidelines / Refresh / Close buttons. Publishing this source does not run the bot: you need your own Discord application/token and an always-on computer or hosting service.

### Features and limits

- Lists up to 20 available tags in a selected accessible **regular forum**, marks moderated tags and shows whether a tag is required.
- Shows new-post slowmode and the default reply slowmode copied to newly created posts, in seconds. Exemptions may apply; existing threads can have different reply slowmodes.
- Displays the first 1,400 UTF-16 code units of guidelines as plain text, using `…` if truncated. Read the full guidelines in the forum. It does not interpret, summarize or translate guidelines.
- Every initial panel and Tags/Guidelines/Refresh click fetches the guild, roles, requesting member, bot member and forum from the REST API. It checks both members' View Channel access using role/member overwrites. These reads are not an atomic permission snapshot; concurrent permission changes can race with a report.
- Turkish or English panels, chosen by the optional `language` field or your Discord locale (Turkish → Turkish; others → English).
- No post/message reading, post creation, channel/role/tag edits, DMs, public sharing, search, automatic tagging, moderation or guarantee that you can post.
- No age-restricted, spoiler or obfuscated forums, or Media channels. Reports are refused when the bot has Administrator.
- Tag emoji objects are omitted; text names are shown. Metadata is placed inside code blocks, with backticks/`@` replaced and controls/bidi characters removed. Links, mentions and dynamic Markdown are not rendered. This is not an exact text backup.

### Requirements

Windows, macOS or Linux; **Node.js 24.13 or newer within 24.x**, bundled npm and internet access. Node 25/26 are outside this release's support range. You need a Discord server with forums, permission to install apps, and your own application/token. Use one server and one running process per installation. No database, paid AI API or web server is required.

### Installation without editing source

1. Open the [Discord Developer Portal](https://discord.com/developers/applications), select **New Application**, and copy the **Application ID** from General Information. It is not the token.
2. Open **Bot**, create/use the bot, and obtain its token with **Reset Token**. Keep the token private: never put it in messages, screenshots, issues, Git or third-party setup websites. Leave **Presence, Server Members and Message Content** privileged intents **off**. The code requests Guilds only.
3. Under **Installation**, use **Guild Install**. User Install is unnecessary. Select scopes `bot` and `applications.commands`; request only **View Channels**, permission integer `1024`. Install into your server using the generated link. Do not request Administrator, Manage Channels, Manage Threads, Send Messages or Read Message History.
4. In Discord, enable **User Settings → Advanced → Developer Mode**. Right-click your server icon and **Copy Server ID**. This differs from Application ID.
5. On GitHub select **Code → Download ZIP**, then extract the ZIP to a normal folder. Keep the eventual secret folder outside shared/cloud-synced folders. Install a supported Node 24 version from the [official download page](https://nodejs.org/en/download). Confirm `node --version` and `npm --version` work in a new terminal.
6. Open a terminal in the extracted folder. Run `setup.cmd` on Windows or `bash setup.sh` on macOS/Linux. They install locked dependencies with scripts disabled. Equivalent commands:

   ```text
   npm ci --ignore-scripts
   npm run setup
   ```

7. Enter Application ID, Server ID, then **only the bot token**. Token characters are hidden. Paste without a newline, then press Enter; multiline pastes are rejected. Ctrl+C cancels. Use an interactive terminal, not redirected input.
8. Setup creates a private `.env` without reading or overwriting an existing one. You do not edit source. New files use mode `0600` on POSIX; restrict folder access to your account on Windows.
9. Run `register.cmd`, then `start.cmd` on Windows, or `bash register.sh`, then `bash start.sh` on macOS/Linux. Equivalent commands: `npm run register`, then `npm start`. Registration creates/updates this application's `/forumfern` guild command; it does not bulk-delete other commands. Repeat registration after command option changes.
10. Wait for **ForumFern connected**. In a channel where you can use commands, run `/forumfern`, choose the target `forum`, and optionally set `language: English`. Confirm the preview is visible only to you.

### Configuration and permissions

Setup writes `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` and `DISCORD_GUILD_ID`. The IDs are identifiers; the token is a password. Hosting secret/environment interfaces can supply the same variables without a `.env` file. Existing environment variables take priority over `.env`. Other servers' interactions are refused; install this application only in the configured server.

Both bot and member need View Channel on the target forum, including category/channel overwrites. The member needs **Use Application Commands** in the invoking channel; this is not an extra permission the bot requests. Private replies use interaction responses and do not send normal channel messages. A member's Administrator does not block reports; the bot's Administrator does. A moderated tag requires Manage Threads according to Discord; this bot never requests that permission or applies tags.

### Usage

Example: `/forumfern forum:workshops language:English`. **Tags** shows names and settings; **Guidelines** shows a bounded plain-text excerpt; **Refresh** rereads the current page. Every read rechecks access. **Close** replaces the panel text and removes controls and the RAM session, without reading the forum again.

Panels expire after 5 minutes, without sliding extension. Commands have a 5-second member/server cooldown; buttons have a 5-second panel cooldown. Limits: 100 panels, 50 concurrent operations, 1,000 short cooldown records. Wait or let old panels expire when busy. Restarting invalidates every panel. Expiry/restart **may leave the old private text and inactive buttons visible in Discord**. A snapshot is not a live authorization guarantee; access revocation cannot retract information already seen.

### Keeping it online

The bot runs while `npm start`, its computer and its internet connection remain active. Sleep, closing the terminal or stopping the host makes it offline. For continuous use choose hosting with Node 24, protected secrets and one persistent process. Follow that provider's restart/log-retention instructions. Do not run two copies with the same token. This repository does not install a VDS service or change production services. Stop with Ctrl+C. To update, stop the bot, obtain the new sources, preserve your secret privately, run `npm ci --ignore-scripts`, register if needed and restart.

### Security and privacy

Store the token only in `.env` or your hosting secret interface; environment files are ignored by Git. If exposed, first Reset Token in the Portal. To rerun setup, move the old `.env` to private storage and run `npm run setup`; do not share it. The bot has no database or analytics. RAM sessions contain user/guild/invoking-channel/application/target-forum/private-response IDs, language/page, expiry and operation state. Forum text is not stored in session records; REST responses temporarily occupy RAM during processing. Cooldowns last about 5 seconds; expired records are removed on the 30-second sweep or next interaction. Guilds Gateway connectivity entails SDK guild/role/channel metadata caches; message/member/user cache limits are zero. Discord and your hosting provider have their own data practices. See [PRIVACY.md](PRIVACY.md).

### Troubleshooting

- **node/npm missing:** install supported Node 24 and open a new terminal. If PowerShell blocks `npm.ps1`, use the `.cmd` helpers or `npm.cmd`; no system policy change is required.
- **Command missing:** check the correct server install, `applications.commands`, successful registration and your Use Application Commands permission. Refresh Discord and keep the bot running.
- **Forum unavailable in picker:** choose a regular Forum, not a text channel, individual forum thread or Media channel. You can invoke from another accessible text channel.
- **Forum unavailable report:** check both members' View Channel and overwrites; remove Administrator from all bot roles. Age-restricted/spoiler forums are refused. Try later for network, Discord 429 or 5xx failures; raw API errors/tokens are not displayed.
- **Expired/busy panel:** wait 5 seconds or open `/forumfern` again. Restarts invalidate controls. Capacity limits are temporary RAM bounds.
- **Invisible token input:** deliberate hidden entry; use a real terminal rather than an IDE output pane. If `.env` exists, back it up privately before rerunning setup.
- **Incomplete/changed guidelines:** text is truncated and sanitized for display; read the original in the forum. Validate mobile/screen-reader presentation on your own client.

### Tests and verification

Run checks in a source checkout without local secret files:

```text
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/verify.mjs
bash -n setup.sh register.sh start.sh
```

`check` runs recommended Biome lint/format, strict TypeScript including dependency types, Node tests, dependency license/registry/SHA-512/no-install-script checks and source credential-pattern scans. Pattern scans cannot guarantee detection of every secret or vulnerability. Supply checks deliberately refuse local `.env` files; never give tests a live token. Windows CI uses Git Bash for shell syntax.

Tests cover 512 overwrite combinations, access loss, private-panel bindings, expiry, capacities/concurrency, malformed input, Unicode bounds and hidden terminal input. Discord REST/interaction transport is mocked; actual unconfigured entry points run in unique temporary directories. **No live Discord token/server or VDS was used.** Real installation/buttons/terminal token entry, mobile/screen-reader behavior and continuous hosting require operator validation. CI runs the same automated checks on Ubuntu, Windows and macOS 15 Intel.

### Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for small tested improvements and setup/accessibility feedback. Keep tokens, private forum text and member data out of issues/PRs. See [SECURITY.md](SECURITY.md) for vulnerability reporting. Source is [MIT licensed](LICENSE); dependencies keep their own licenses.

### Official references / Resmi kaynaklar

- [Discord channels and forum tags](https://docs.discord.com/developers/resources/channel)
- [Discord permissions](https://docs.discord.com/developers/topics/permissions)
- [Interaction responses](https://docs.discord.com/developers/interactions/receiving-and-responding)
- [Application commands](https://docs.discord.com/developers/interactions/application-commands)
- [Gateway intents](https://docs.discord.com/developers/events/gateway)
- [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)

API/SDK references reviewed on 2026-10-16. / API/SDK belgeleri 2026-10-16 tarihinde incelendi.
