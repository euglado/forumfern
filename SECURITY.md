# Security / Güvenlik

Supported: latest main revision on Node 24.x within package.json's engine range. Keep dependencies current and rerun all checks before deployment. No automated scan is a security certification.

If a bot token leaks, immediately reset it in the Discord Developer Portal, replace local/hosting secrets and restart. Removing a Git commit alone does not revoke a token. Do not post tokens, private guidelines or member records in issues. Use GitHub's private vulnerability reporting if the repository provides that option. Otherwise open a minimal issue asking the maintainer for a private channel, without exploit details or confidential data. No guaranteed response window or bounty is offered.

Default install asks only View Channel; no privileged intents. Bot Administrator is refused. Every metadata read uses fresh API permission resources, but those reads are not atomic and cannot retract old responses. Source scans are pattern-based; review your own machine/hosting secrets separately.

---

Desteklenen sürüm: package.json aralığındaki Node 24.x ile en güncel main. Dağıtımdan önce bağımlılıkları ve kontrolleri güncel tutun; taramalar güvenlik sertifikası değildir.

Token sızarsa Portal'da hemen sıfırlayın, yerel/barındırma sırlarını değiştirip yeniden başlatın. Git commitini silmek tokenı iptal etmez. Issue içine token, özel yönerge veya üye kaydı koymayın. Depoda GitHub özel güvenlik bildirimi varsa kullanın; yoksa açık istismar ayrıntısı vermeden özel bildirim kanalı isteyen kısa bir issue açın. Yanıt süresi veya ödül garantisi yoktur.

Varsayılan kurulum yalnızca View Channel ister, ayrıcalıklı intent istemez. Bot Administrator reddedilir. Metadata okumaları güncel API izin bilgilerini kullanır; okumalar atomik değildir ve eski yanıtları geri alamaz. Kaynak taraması desen tabanlıdır; kendi makine/barındırma sırlarınızı ayrıca kontrol edin.
