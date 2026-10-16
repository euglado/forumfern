import { randomBytes } from "node:crypto";
import { type Forum, type Lang, render } from "./forum.ts";
export type Identity = {
  user: string;
  guild: string;
  channel: string;
  app: string;
};
export type Request =
  | (Identity & { kind: "command"; forum: string; lang: Lang })
  | (Identity & {
      kind: "button";
      customId: string;
      message: string;
      ephemeral: boolean;
    });
export type Payload = {
  content: string;
  controls: { id: string; label: string }[];
};
export type Port = {
  defer(button: boolean): Promise<void>;
  write(payload: Payload): Promise<string>;
  error(content: string): Promise<void>;
};
type Session = Identity & {
  forum: string;
  lang: Lang;
  page: "tags" | "guide";
  message: string;
  expires: number;
  busy: boolean;
  next: number;
};
const failure =
  "Forum unavailable. Check access, remove bot Administrator, and choose a regular forum. Try again later. / Forum kullanılamıyor. Erişimi kontrol edin, bottan Yönetici iznini kaldırın ve normal bir forum seçin. Daha sonra tekrar deneyin.";
export class Panels {
  readonly sessions = new Map<string, Session>();
  readonly cooldowns = new Map<string, number>();
  running = 0;
  readonly read: (guild: string, forum: string, user: string) => Promise<Forum>;
  readonly now: () => number;
  constructor(
    read: (guild: string, forum: string, user: string) => Promise<Forum>,
    now: () => number = Date.now,
  ) {
    this.read = read;
    this.now = now;
  }
  prune() {
    const now = this.now();
    for (const [k, v] of this.sessions)
      if (v.expires <= now && !v.busy) this.sessions.delete(k);
    for (const [k, v] of this.cooldowns) if (v <= now) this.cooldowns.delete(k);
  }
  async handle(r: Request, port: Port): Promise<void> {
    this.prune();
    if (r.kind === "command") {
      const key = `${r.guild}:${r.user}`,
        now = this.now();
      if (
        this.running >= 50 ||
        this.sessions.size >= 100 ||
        this.cooldowns.size >= 1000 ||
        (this.cooldowns.get(key) ?? 0) > now
      ) {
        await port.error(
          "Please wait 5 seconds; panels may be busy. / 5 saniye bekleyin; paneller meşgul olabilir.",
        );
        return;
      }
      this.cooldowns.set(key, now + 5000);
      this.running++;
      const id = randomBytes(12).toString("hex");
      try {
        await port.defer(false);
        const f = await this.read(r.guild, r.forum, r.user);
        const s: Session = {
          user: r.user,
          guild: r.guild,
          channel: r.channel,
          app: r.app,
          forum: r.forum,
          lang: r.lang,
          page: "tags",
          message: "",
          expires: this.now() + 300000,
          busy: true,
          next: 0,
        };
        // Reserve the slot before writing; concurrent reads cannot exceed the cap.
        if (this.sessions.size >= 100) throw Error("Panel capacity");
        this.sessions.set(id, s);
        s.message = await port.write(this.payload(id, s, f));
        s.busy = false;
      } catch {
        this.sessions.delete(id);
        await port.write({ content: failure, controls: [] }).catch(() => {});
      } finally {
        this.running--;
      }
      return;
    }
    const match = /^ff:([a-f0-9]{24}):(tags|guide|refresh|close)$/.exec(
      r.customId,
    );
    const id = match?.[1],
      action = match?.[2],
      s = id ? this.sessions.get(id) : undefined;
    if (
      match?.[0] !== r.customId ||
      !id ||
      !action ||
      !s ||
      !r.ephemeral ||
      s.user !== r.user ||
      s.guild !== r.guild ||
      s.channel !== r.channel ||
      s.app !== r.app ||
      s.message !== r.message
    ) {
      await port.error(
        "Panel expired or unavailable. Run /forumfern again. / Panel süresi doldu veya kullanılamıyor. /forumfern komutunu tekrar çalıştırın.",
      );
      return;
    }
    if (s.busy || s.next > this.now() || this.running >= 50) {
      await port.error("Please wait 5 seconds. / 5 saniye bekleyin.");
      return;
    }
    s.busy = true;
    s.next = this.now() + 5000;
    this.running++;
    try {
      await port.defer(true);
      if (action === "close") {
        this.sessions.delete(id);
        await port.write({
          content: s.lang === "tr" ? "Panel kapatıldı." : "Panel closed.",
          controls: [],
        });
        return;
      }
      const f = await this.read(s.guild, s.forum, s.user);
      if (this.now() >= s.expires) throw Error("Expired while reading");
      if (action === "tags" || action === "guide") s.page = action;
      await port.write(this.payload(id, s, f));
    } catch {
      this.sessions.delete(id);
      await port.write({ content: failure, controls: [] }).catch(() => {});
    } finally {
      s.busy = false;
      this.running--;
    }
  }
  payload(id: string, s: Session, f: Forum): Payload {
    const labels =
      s.lang === "tr"
        ? ["Etiketler", "Yönerge", "Yenile", "Kapat"]
        : ["Tags", "Guidelines", "Refresh", "Close"];
    return {
      content: render(f, s.lang, s.page),
      controls: ["tags", "guide", "refresh", "close"].map((a, i) => ({
        id: `ff:${id}:${a}`,
        label: labels[i] ?? a,
      })),
    };
  }
}
