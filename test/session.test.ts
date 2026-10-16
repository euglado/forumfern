import assert from "node:assert/strict";
import { test } from "node:test";
import type { Forum } from "../src/forum.ts";
import {
  Panels,
  type Payload,
  type Port,
  type Request,
} from "../src/session.ts";
import { must } from "./must.ts";

const forum: Forum = {
  name: "Forum",
  topic: "Guidelines",
  tags: [],
  required: false,
  postDelay: 0,
  replyDelay: 0,
};
const identity = {
  user: "user",
  guild: "guild",
  channel: "channel",
  app: "app",
};
const command: Request = {
  ...identity,
  kind: "command",
  forum: "forum",
  lang: "en",
};
function mock() {
  const writes: Payload[] = [],
    errors: string[] = [],
    defers: boolean[] = [];
  const port: Port = {
    defer: async (b) => {
      defers.push(b);
    },
    write: async (p) => {
      writes.push(p);
      return "message";
    },
    error: async (e) => {
      errors.push(e);
    },
  };
  return { writes, errors, defers, port };
}
async function opened(read: () => Promise<Forum> = async () => forum) {
  let now = 10000;
  let reads = 0;
  const panels = new Panels(
    async () => {
      reads++;
      return read();
    },
    () => now,
  );
  const io = mock();
  await panels.handle(command, io.port);
  const id = must(must(must(io.writes[0]).controls[0]).id.split(":")[1]);
  const button: Request = {
    ...identity,
    kind: "button",
    customId: `ff:${id}:guide`,
    message: "message",
    ephemeral: true,
  };
  return {
    panels,
    io,
    button,
    tick: (n = 5001) => {
      now += n;
    },
    reads: () => reads,
    id,
  };
}
test("initial private defer precedes report; IDs bound in RAM", async () => {
  const s = await opened();
  assert.deepEqual(s.io.defers, [false]);
  assert.equal(s.panels.sessions.size, 1);
  assert.equal(must(s.io.writes[0]).controls.length, 4);
  assert.equal(s.panels.running, 0);
  assert(
    !JSON.stringify([...s.panels.sessions.values()]).includes("Guidelines"),
  );
});
test("all tabs and refresh reread; close erases without API read", async () => {
  const s = await opened();
  for (const action of ["guide", "refresh", "tags"]) {
    s.tick();
    await s.panels.handle(
      { ...s.button, customId: `ff:${s.id}:${action}` },
      s.io.port,
    );
  }
  assert.equal(s.reads(), 4);
  s.tick();
  await s.panels.handle(
    { ...s.button, customId: `ff:${s.id}:close` },
    s.io.port,
  );
  assert.equal(s.reads(), 4);
  assert.equal(s.panels.sessions.size, 0);
  assert.deepEqual(s.io.writes.at(-1), {
    content: "Panel closed.",
    controls: [],
  });
});
for (const [key, value] of Object.entries({
  user: "other",
  guild: "other",
  channel: "other",
  app: "other",
  message: "other",
  ephemeral: false,
}))
  test(`rejects changed binding ${key}`, async () => {
    const s = await opened();
    await s.panels.handle({ ...s.button, [key]: value }, s.io.port);
    assert.equal(s.io.errors.length, 1);
    assert.equal(s.reads(), 1);
    assert.equal(s.io.writes.length, 1);
  });
test("rejects malformed controls", async () => {
  const s = await opened();
  for (const customId of [
    "ff:bad:guide",
    `ff:${s.id}:delete`,
    `ff:${s.id}:guide\n`,
  ])
    await s.panels.handle({ ...s.button, customId }, s.io.port);
  assert.equal(s.io.errors.length, 3);
  assert.equal(s.reads(), 1);
});
test("expiry and restart invalidate controls", async () => {
  const s = await opened();
  s.tick(300000);
  await s.panels.handle(s.button, s.io.port);
  assert.equal(s.panels.sessions.size, 0);
  assert.equal(s.io.errors.length, 1);
  await new Panels(async () => forum).handle(s.button, s.io.port);
  assert.equal(s.io.errors.length, 2);
});
test("pruning removes cooldowns and idle panels", async () => {
  const s = await opened();
  s.tick(300001);
  s.panels.prune();
  assert.equal(s.panels.sessions.size, 0);
  assert.equal(s.panels.cooldowns.size, 0);
});
test("same requester command gate blocks repeated API reads", async () => {
  const s = await opened();
  await s.panels.handle(command, s.io.port);
  assert.equal(s.reads(), 1);
  assert.equal(s.io.errors.length, 1);
  s.tick();
  await s.panels.handle(command, s.io.port);
  assert.equal(s.reads(), 2);
});
test("button cooldown blocks repeated API reads", async () => {
  const s = await opened();
  await s.panels.handle(s.button, s.io.port);
  await s.panels.handle(s.button, s.io.port);
  assert.equal(s.reads(), 2);
  assert.equal(s.io.errors.length, 1);
});
test("read access loss clears old content and session", async () => {
  let fail = false;
  const s = await opened(async () => {
    if (fail) throw Error("secret metadata");
    return forum;
  });
  fail = true;
  await s.panels.handle(s.button, s.io.port);
  assert.equal(s.panels.sessions.size, 0);
  assert.deepEqual(must(s.io.writes.at(-1)).controls, []);
  assert(!must(s.io.writes.at(-1)).content.includes("secret metadata"));
});
test("initial failure leaves no session and bounded running count", async () => {
  const p = new Panels(async () => {
    throw Error("private error");
  });
  const io = mock();
  await p.handle(command, io.port);
  assert.equal(p.sessions.size, 0);
  assert.equal(p.running, 0);
  assert(!must(io.writes[0]).content.includes("private error"));
});
test("failed deferred acknowledgement never reads", async () => {
  let read = false;
  const p = new Panels(async () => {
    read = true;
    return forum;
  });
  const io = mock();
  io.port.defer = async () => {
    throw Error("timeout");
  };
  await p.handle(command, io.port);
  assert.equal(read, false);
  assert.equal(p.running, 0);
});
test("failed report transport cleans session", async () => {
  const p = new Panels(async () => forum);
  const io = mock();
  io.port.write = async () => {
    throw Error("network");
  };
  await p.handle(command, io.port);
  assert.equal(p.sessions.size, 0);
  assert.equal(p.running, 0);
});
test("concurrent clicks are excluded while reading", async () => {
  let release: ((f: Forum) => void) | undefined;
  let blocked = false;
  const s = await opened(async () =>
    blocked
      ? new Promise<Forum>((r) => {
          release = r;
        })
      : forum,
  );
  blocked = true;
  const pending = s.panels.handle(s.button, s.io.port);
  await new Promise((r) => setImmediate(r));
  s.tick();
  await s.panels.handle(s.button, s.io.port);
  assert.equal(s.io.errors.length, 1);
  must(release)(forum);
  await pending;
  assert.equal(s.panels.running, 0);
});
test("read that outlives session clears the panel", async () => {
  let expire = false;
  const s = await opened(async () => {
    if (expire) s.tick(300001);
    return forum;
  });
  expire = true;
  await s.panels.handle(s.button, s.io.port);
  assert.equal(s.panels.sessions.size, 0);
  assert.deepEqual(must(s.io.writes.at(-1)).controls, []);
});
test("100-panel cap rejects a new command before reading", async () => {
  const p = new Panels(
    async () => forum,
    () => 10000,
  );
  const io = mock();
  for (let n = 0; n < 100; n++)
    await p.handle({ ...command, user: `user${n}` }, io.port);
  assert.equal(p.sessions.size, 100);
  await p.handle({ ...command, user: "overflow" }, io.port);
  assert.equal(io.errors.length, 1);
  assert.equal(p.sessions.size, 100);
});
test("50-read cap rejects overflow and releases capacity", async () => {
  const releases: ((f: Forum) => void)[] = [];
  const p = new Panels(
    () =>
      new Promise<Forum>((r) => {
        releases.push(r);
      }),
    () => 10000,
  );
  const io = mock();
  const pending = Array.from({ length: 50 }, (_, n) =>
    p.handle({ ...command, user: `user${n}` }, io.port),
  );
  await new Promise((r) => setImmediate(r));
  assert.equal(p.running, 50);
  await p.handle({ ...command, user: "overflow" }, io.port);
  assert.equal(io.errors.length, 1);
  for (const release of releases) release(forum);
  await Promise.all(pending);
  assert.equal(p.running, 0);
  assert.equal(p.sessions.size, 50);
});
test("bounded 1000 cooldown records reject overflow", async () => {
  const p = new Panels(
    async () => forum,
    () => 10000,
  );
  for (let n = 0; n < 1000; n++) p.cooldowns.set(`g:${n}`, 20000);
  const io = mock();
  await p.handle(command, io.port);
  assert.equal(io.errors.length, 1);
  assert.equal(p.cooldowns.size, 1000);
});
