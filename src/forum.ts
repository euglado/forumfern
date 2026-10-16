export type Lang = "tr" | "en";
type Member = { user?: { id: string }; roles: string[] };
export type Snapshot = {
  guild: { id: string; owner_id: string };
  roles: { id: string; permissions: string }[];
  member: Member;
  bot: Member;
  channel: {
    id: string;
    guild_id: string;
    type: number;
    name: string;
    topic: string | null;
    nsfw?: boolean;
    flags?: number;
    permission_overwrites: {
      id: string;
      type: number;
      allow: string;
      deny: string;
    }[];
    available_tags: { id: string; name: string; moderated: boolean }[];
    rate_limit_per_user?: number;
    default_thread_rate_limit_per_user?: number;
  };
};
export type Forum = {
  name: string;
  topic: string;
  tags: { name: string; moderated: boolean }[];
  required: boolean;
  postDelay: number;
  replyDelay: number;
};
const VIEW = 1024n,
  ADMIN = 8n;
export function permissions(snapshot: Snapshot, member: Member): bigint {
  const roleIds = new Set([snapshot.guild.id, ...member.roles]);
  if ([...roleIds].some((id) => !snapshot.roles.some((role) => role.id === id)))
    throw Error("Incomplete roles");
  let bits = snapshot.roles
    .filter((role) => roleIds.has(role.id))
    .reduce((sum, role) => sum | BigInt(role.permissions), 0n);
  if (member.user?.id === snapshot.guild.owner_id || (bits & ADMIN) !== 0n)
    return -1n;
  const overwrites = snapshot.channel.permission_overwrites;
  if (!Array.isArray(overwrites)) throw Error("Incomplete overwrites");
  const everyone = overwrites.find(
    (o) => o.id === snapshot.guild.id && o.type === 0,
  );
  if (everyone) bits = (bits & ~BigInt(everyone.deny)) | BigInt(everyone.allow);
  let allow = 0n,
    deny = 0n;
  for (const o of overwrites) {
    if (o.type === 0 && o.id !== snapshot.guild.id && roleIds.has(o.id)) {
      allow |= BigInt(o.allow);
      deny |= BigInt(o.deny);
    }
  }
  bits = (bits & ~deny) | allow;
  const own = overwrites.find((o) => o.type === 1 && o.id === member.user?.id);
  if (own) bits = (bits & ~BigInt(own.deny)) | BigInt(own.allow);
  return bits;
}
export function inspect(
  s: Snapshot,
  ids: { guild: string; forum: string; user: string; bot: string },
): Forum {
  if (
    s.guild.id !== ids.guild ||
    s.channel.guild_id !== ids.guild ||
    s.channel.id !== ids.forum ||
    s.member.user?.id !== ids.user ||
    s.bot.user?.id !== ids.bot
  )
    throw Error("Resource mismatch");
  if (
    s.channel.type !== 15 ||
    s.channel.nsfw ||
    ((s.channel.flags ?? 0) & ((1 << 17) | (1 << 21))) !== 0
  )
    throw Error("Unsupported forum");
  const bot = permissions(s, s.bot);
  if (
    (bot & ADMIN) !== 0n ||
    (bot & VIEW) === 0n ||
    (permissions(s, s.member) & VIEW) === 0n
  )
    throw Error("Access unavailable");
  if (s.channel.available_tags.length > 20) throw Error("Unexpected tags");
  return {
    name: s.channel.name,
    topic: s.channel.topic ?? "",
    tags: s.channel.available_tags.map((t) => ({
      name: t.name,
      moderated: t.moderated,
    })),
    required: ((s.channel.flags ?? 0) & 16) !== 0,
    postDelay: s.channel.rate_limit_per_user ?? 0,
    replyDelay: s.channel.default_thread_rate_limit_per_user ?? 0,
  };
}
// Plain text inside code blocks; no dynamic Markdown, mentions or clickable links.
export function plain(value: string, max: number): string {
  const clean = value
    .normalize("NFC")
    .replace(
      // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally remove control characters from forum text.
      /[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/gu,
      "",
    )
    .replace(/`/g, "ˋ")
    .replace(/@/g, "＠");
  if (clean.length <= max) return clean;
  let output = "";
  for (const char of clean) {
    if (output.length + char.length > max - 1) break;
    output += char;
  }
  return `${output}…`;
}
export function render(f: Forum, lang: Lang, page: "tags" | "guide"): string {
  const tr = lang === "tr";
  const title = `ForumFern · ${tr ? "Özel önizleme" : "Private preview"}\n\`\`\`\n${plain(f.name, 100)}\n\`\`\``;
  const footer = tr
    ? "\nAnlık görünüm; paylaşım izni garantisi değildir. Panel 5 dakika geçerlidir."
    : "\nSnapshot; not a guarantee you can post. Panel expires in 5 minutes.";
  if (page === "guide")
    return `${title}\n${tr ? "Yönerge (ilk 1.400 karakter; tam metin için forumu açın)" : "Guidelines (first 1,400 characters; open the forum for full text)"}\n\`\`\`\n${plain(f.topic || (tr ? "Yönerge belirtilmemiş." : "No guidelines set."), 1400)}\n\`\`\`${footer}`;
  const tags =
    f.tags
      .map(
        (t, i) =>
          `${i + 1}. ${plain(t.name, 20)}${t.moderated ? (tr ? " [moderatör etiketi]" : " [moderated tag]") : ""}`,
      )
      .join("\n") || (tr ? "Etiket tanımlanmamış." : "No tags configured.");
  return `${title}\n${tr ? "Etiketler" : "Tags"} (${f.tags.length}/20)\n\`\`\`\n${tags}\n\`\`\`\n${tr ? "En az bir etiket gerekli" : "At least one tag required"}: ${f.required ? (tr ? "evet" : "yes") : tr ? "hayır" : "no"}\n${tr ? "Yeni gönderi yavaş modu" : "New-post slowmode"}: ${f.postDelay}s\n${tr ? "Yeni gönderilerde varsayılan yanıt yavaş modu" : "Default reply slowmode for new posts"}: ${f.replyDelay}s\n${tr ? "Moderatör etiketleri Manage Threads izni gerektirir. Süreler herkese aynı uygulanmayabilir." : "Moderated tags require Manage Threads. Slowmodes may have exemptions."}${footer}`;
}
