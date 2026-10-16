import fs from "node:fs";
import readline from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { config } from "../src/config.ts";
export function secret(input = process.stdin, output = process.stdout) {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== "function")
    return Promise.reject(
      Error("Open an interactive terminal. / Etkileşimli terminal açın."),
    );
  return new Promise((resolve, reject) => {
    const raw = !!input.isRaw,
      paused = input.isPaused();
    let value = "";
    const done = (err) => {
      input.off("data", data);
      input.off("error", fail);
      input.setRawMode(raw);
      if (paused) input.pause();
      output.write("\n");
      if (err) reject(err);
      else resolve(value);
    };
    const fail = () => done(Error("Input failed. / Giriş başarısız."));
    const data = (chunk) => {
      const text = chunk.toString("utf8");
      if (text === "\r" || text === "\n") {
        done();
        return;
      }
      if (text.includes("\u0003")) {
        done(Error("Cancelled. / İptal edildi."));
        return;
      }
      if (text === "\u007f" || text === "\b") {
        value = value.slice(0, -1);
        return;
      }
      if (!/^[A-Za-z0-9_.-]+$/.test(text) || value.length + text.length > 200) {
        done(
          Error(
            "Paste only the token, without a newline. / Yalnızca tokenı, satır sonu olmadan yapıştırın.",
          ),
        );
        return;
      }
      value += text;
    };
    output.write("Bot token (hidden / gizli): ");
    input.setRawMode(true);
    input.on("data", data);
    input.on("error", fail);
    input.resume();
  });
}
export async function setup() {
  if (fs.existsSync(".env"))
    throw Error(
      ".env already exists; back it up privately before changing setup. / .env zaten var; kurulumu değiştirmeden önce özel olarak yedekleyin.",
    );
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw Error("Open an interactive terminal. / Etkileşimli terminal açın.");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let app, guild;
  try {
    app = (await rl.question("Application ID / Uygulama kimliği: ")).trim();
    guild = (await rl.question("Server ID / Sunucu kimliği: ")).trim();
  } finally {
    rl.close();
  }
  const token = await secret();
  config({
    DISCORD_TOKEN: token,
    DISCORD_APPLICATION_ID: app,
    DISCORD_GUILD_ID: guild,
  });
  fs.writeFileSync(
    ".env",
    `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${app}\nDISCORD_GUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Saved private .env. Next: npm run register, then npm start. / Özel .env kaydedildi. Sırada: npm run register ve npm start.",
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  setup().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
