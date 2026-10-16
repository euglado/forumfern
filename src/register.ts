import { config } from "./config.ts";
import { transport } from "./reader.ts";
import { registerCommand } from "./registration.ts";

async function main() {
  const c = config();
  const rest = transport(c.token);
  await registerCommand(rest, c.app, c.guild);
  console.log(
    "Registered /forumfern in your server. / Sunucunuzda /forumfern kaydedildi.",
  );
}
main().catch(() => {
  console.error(
    "Registration failed. Run npm run setup; check token, application/server IDs, install and network. / Kayıt başarısız. npm run setup çalıştırın; token, uygulama/sunucu kimliklerini, kurulumu ve ağı kontrol edin.",
  );
  process.exitCode = 1;
});
