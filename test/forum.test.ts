import assert from "node:assert/strict";
import { test } from "node:test";
import { command } from "../src/command.ts";
import { config } from "../src/config.ts";
import {
  inspect,
  permissions,
  plain,
  render,
  type Snapshot,
} from "../src/forum.ts";
import { readForum, transport } from "../src/reader.ts";
import { registerCommand } from "../src/registration.ts";
import { must } from "./must.ts";

const ids = {
  guild: "100000000000000001",
  forum: "100000000000000002",
  user: "100000000000000003",
  bot: "100000000000000004",
};
export function fixture(): Snapshot {
  return {
    guild: { id: ids.guild, owner_id: "owner" },
    roles: [
      { id: ids.guild, permissions: "1024" },
      { id: "extra", permissions: "0" },
    ],
    member: { user: { id: ids.user }, roles: ["extra"] },
    bot: { user: { id: ids.bot }, roles: [] },
    channel: {
      id: ids.forum,
      guild_id: ids.guild,
      type: 15,
      name: "Workshops",
      topic: "Read before posting.",
      nsfw: false,
      flags: 16,
      permission_overwrites: [],
      available_tags: [{ id: "tag", name: "Questions", moderated: false }],
      rate_limit_per_user: 15,
      default_thread_rate_limit_per_user: 5,
    },
  } as Snapshot;
}
test("returns only orientation data, not IDs or member records", () => {
  assert.deepEqual(inspect(fixture(), ids), {
    name: "Workshops",
    topic: "Read before posting.",
    tags: [{ name: "Questions", moderated: false }],
    required: true,
    postDelay: 15,
    replyDelay: 5,
  });
});
for (const key of ["guild", "forum", "user", "bot"] as const)
  test(`rejects wrong ${key}`, () =>
    assert.throws(() => inspect(fixture(), { ...ids, [key]: "other" })));
for (const flag of [1 << 17, 1 << 21])
  test(`rejects restricted flag ${flag}`, () => {
    const s = fixture();
    s.channel.flags = flag;
    assert.throws(() => inspect(s, ids));
  });
test("rejects age-restricted forum", () => {
  const s = fixture();
  s.channel.nsfw = true;
  assert.throws(() => inspect(s, ids));
});
test("rejects foreign channel guild", () => {
  const s = fixture();
  s.channel.guild_id = "other";
  assert.throws(() => inspect(s, ids));
});
test("refuses bot Administrator and bot guild ownership", () => {
  const s = fixture();
  must(s.roles[0]).permissions = "1032";
  assert.throws(() => inspect(s, ids));
  must(s.roles[0]).permissions = "1024";
  s.guild.owner_id = ids.bot;
  assert.throws(() => inspect(s, ids));
});
for (const target of ["member", "bot"] as const)
  test(`refuses denied ${target} view`, () => {
    const s = fixture();
    s.channel.permission_overwrites = [
      { id: must(s[target].user).id, type: 1, allow: "0", deny: "1024" },
    ];
    assert.throws(() => inspect(s, ids));
  });
test("fails closed for missing role", () => {
  const s = fixture();
  s.member.roles.push("missing");
  assert.throws(() => inspect(s, ids));
});
test("owner and Administrator member bypass overwrites", () => {
  const s = fixture();
  s.channel.permission_overwrites = [
    { id: ids.user, type: 1, allow: "0", deny: "1024" },
  ];
  s.guild.owner_id = ids.user;
  assert.equal(permissions(s, s.member), -1n);
  s.guild.owner_id = "owner";
  must(s.roles[1]).permissions = "8";
  assert.equal(permissions(s, s.member), -1n);
});
test("512 independent View Channel permission combinations", () => {
  for (let n = 0; n < 512; n++) {
    const b = Array.from({ length: 9 }, (_, i) => (n & (1 << i)) !== 0);
    const s = fixture();
    must(s.roles[0]).permissions = b[0] ? "1024" : "0";
    must(s.roles[1]).permissions = b[1] ? "1024" : "0";
    s.channel.permission_overwrites = [
      {
        id: ids.guild,
        type: 0,
        allow: b[3] ? "1024" : "0",
        deny: b[2] ? "1024" : "0",
      },
      {
        id: "extra",
        type: 0,
        allow: b[5] ? "1024" : "0",
        deny: b[4] ? "1024" : "0",
      },
      {
        id: ids.user,
        type: 1,
        allow: b[7] ? "1024" : "0",
        deny: b[6] ? "1024" : "0",
      },
      {
        id: "unrelated",
        type: 1,
        allow: b[8] ? "1024" : "0",
        deny: b[8] ? "1024" : "0",
      },
    ];
    let expected = !!(b[0] || b[1]);
    if (b[2]) expected = false;
    if (b[3]) expected = true;
    if (b[4]) expected = false;
    if (b[5]) expected = true;
    if (b[6]) expected = false;
    if (b[7]) expected = true;
    assert.equal(
      (permissions(s, s.member) & 1024n) !== 0n,
      expected,
      `case ${n}`,
    );
  }
});
test("multiple role allows beat aggregate denies; member deny wins last", () => {
  const s = fixture();
  s.roles.push({ ...must(s.roles[1]), id: "second" });
  s.member.roles.push("second");
  s.channel.permission_overwrites = [
    { id: "extra", type: 0, allow: "0", deny: "1024" },
    { id: "second", type: 0, allow: "1024", deny: "0" },
  ];
  assert.equal(permissions(s, s.member) & 1024n, 1024n);
  s.channel.permission_overwrites.push({
    id: ids.user,
    type: 1,
    allow: "0",
    deny: "1024",
  });
  assert.equal(permissions(s, s.member) & 1024n, 0n);
});
test("plain text neutralizes code blocks, pings, bidi and controls", () => {
  const p = plain("```@everyone\u202e\u0000", 100);
  assert(!p.includes("`"));
  assert(!p.includes("@"));
  assert(!p.includes("\u202e"));
  assert(!p.includes("\u0000"));
});
test("Unicode limit respects UTF-16 without splitting surrogate pairs", () => {
  assert.equal(plain("😀".repeat(100), 10), `${"😀".repeat(4)}…`);
  assert(plain("a".repeat(100), 10).length <= 10);
});
for (const lang of ["tr", "en"] as const)
  for (const page of ["tags", "guide"] as const)
    test(`worst-case ${lang} ${page} fits Discord content limit`, () => {
      const f = inspect(fixture(), ids);
      f.name = "😀".repeat(100);
      f.topic = "😀".repeat(4096);
      f.tags = Array.from({ length: 20 }, () => ({
        name: "😀".repeat(20),
        moderated: true,
      }));
      const content = render(f, lang, page);
      assert(content.length <= 2000, `${content.length}`);
      assert.equal((content.match(/```/g) ?? []).length, 4);
    });
test("empty tags/topic and optional slowmodes render honestly", () => {
  const s = fixture();
  s.channel.available_tags = [];
  s.channel.topic = null;
  delete s.channel.rate_limit_per_user;
  delete s.channel.default_thread_rate_limit_per_user;
  s.channel.flags = 0;
  const f = inspect(s, ids);
  assert.equal(f.postDelay, 0);
  assert.equal(f.replyDelay, 0);
  assert.match(render(f, "en", "tags"), /No tags/);
  assert.match(render(f, "en", "guide"), /No guidelines/);
});
test("reader fetches five fresh official resources, no messages", async () => {
  const s = fixture();
  const paths: string[] = [];
  const values = [s.guild, s.roles, s.member, s.bot, s.channel];
  const result = await readForum(
    {
      get: async (path) => {
        paths.push(path);
        return values[paths.length - 1];
      },
    },
    ids,
  );
  assert.equal(result.name, "Workshops");
  assert.deepEqual(paths, [
    `/guilds/${ids.guild}`,
    `/guilds/${ids.guild}/roles`,
    `/guilds/${ids.guild}/members/${ids.user}`,
    `/guilds/${ids.guild}/members/${ids.bot}`,
    `/channels/${ids.forum}`,
  ]);
});
test("reader propagates API failure without a partial report", async () => {
  await assert.rejects(() =>
    readForum(
      {
        get: async () => {
          throw Error("not logged");
        },
      },
      ids,
    ),
  );
});
test("reader retains its slot until outstanding requests settle after failure", async () => {
  let calls = 0,
    settled = false;
  const release: ((value: unknown) => void)[] = [];
  const pending = readForum(
    {
      get: async () => {
        calls++;
        if (calls === 1) throw Error("denied");
        return new Promise((resolve) => release.push(resolve));
      },
    },
    ids,
  ).catch(() => {
    settled = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 5);
  assert.equal(settled, false);
  for (const done of release) done({});
  await pending;
  assert.equal(settled, true);
});
test("REST has bounded timeout, no retries, rejects rate-limit waits", () => {
  const r = transport("placeholder");
  assert.equal(r.options.retries, 0);
  assert.equal(r.options.timeout, 10000);
  assert.equal(typeof r.options.rejectOnRateLimit, "function");
});
test("guild command payload omits global-only fields and limits to forums", () => {
  const c = command.toJSON();
  assert.equal(c.contexts, undefined);
  assert.equal(c.integration_types, undefined);
  assert.equal(c.name, "forumfern");
  assert.deepEqual(
    (must(c.options?.[0]) as { channel_types: number[] }).channel_types,
    [15],
  );
});
test("registration verifies application then upserts one guild command", async () => {
  const calls: unknown[] = [];
  await registerCommand(
    {
      get: async (route) => {
        calls.push(route);
        return { id: ids.bot };
      },
      post: async (route, options) => {
        calls.push({ route, body: options.body });
        return {};
      },
    },
    ids.bot,
    ids.guild,
  );
  assert.deepEqual(calls, [
    "/users/%40me",
    {
      route: `/applications/${ids.bot}/guilds/${ids.guild}/commands`,
      body: command.toJSON(),
    },
  ]);
});
test("registration refuses mismatched application before mutation", async () => {
  let posted = false;
  await assert.rejects(() =>
    registerCommand(
      {
        get: async () => ({ id: "other" }),
        post: async () => {
          posted = true;
        },
      },
      ids.bot,
      ids.guild,
    ),
  );
  assert.equal(posted, false);
});
test("missing/invalid config refuses without printing token", () => {
  assert.throws(() => config({}));
  for (const id of ["0", "123", "100000000000000001\n", "x".repeat(18)])
    assert.throws(() =>
      config({
        DISCORD_TOKEN: "a".repeat(35),
        DISCORD_APPLICATION_ID: id,
        DISCORD_GUILD_ID: ids.guild,
      }),
    );
});
