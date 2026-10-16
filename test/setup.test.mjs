import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { secret } from "../scripts/setup.mjs";

function terminal() {
  const input = new EventEmitter();
  input.isTTY = true;
  input.isRaw = false;
  input.paused = true;
  input.isPaused = () => input.paused;
  input.setRawMode = (raw) => {
    input.isRaw = raw;
  };
  input.resume = () => {
    input.paused = false;
  };
  input.pause = () => {
    input.paused = true;
  };
  const output = {
    isTTY: true,
    text: "",
    write(text) {
      this.text += text;
    },
  };
  return { input, output };
}
test("hidden token input, backspace and terminal restoration", async () => {
  const { input, output } = terminal();
  const pending = secret(input, output);
  input.emit("data", Buffer.from(`${"a".repeat(35)}x`));
  input.emit("data", Buffer.from("\u007f"));
  input.emit("data", Buffer.from("\r"));
  assert.equal(await pending, "a".repeat(35));
  assert(!output.text.includes("a".repeat(35)));
  assert.equal(input.isRaw, false);
  assert.equal(input.paused, true);
  assert.equal(input.listenerCount("data"), 0);
});
for (const value of ["\u0003", "paste\nmore", "bad token"])
  test(`rejects invalid hidden input ${JSON.stringify(value)}`, async () => {
    const { input, output } = terminal();
    const pending = secret(input, output);
    input.emit("data", Buffer.from(value));
    await assert.rejects(pending);
    assert.equal(input.isRaw, false);
    assert.equal(input.listenerCount("data"), 0);
    assert(!output.text.includes("paste"));
  });
test("refuses redirected token input", async () => {
  await assert.rejects(secret({ isTTY: false }, { isTTY: false }));
});
const root = fileURLToPath(new URL("../", import.meta.url));
for (const file of ["src/main.ts", "src/register.ts", "scripts/setup.mjs"])
  test(`unconfigured ${file} exits safely without files`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "forumfern-smoke-"));
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
    try {
      const run = spawnSync(process.execPath, [path.join(root, file)], {
        cwd: dir,
        encoding: "utf8",
        timeout: 20000,
        env: {
          PATH: process.env.PATH,
          SystemRoot: process.env.SystemRoot,
          TEMP: os.tmpdir(),
          TMP: os.tmpdir(),
        },
      });
      assert.equal(run.status, 1, run.stderr);
      assert.equal(run.error, undefined);
      assert.match(
        run.stderr,
        file === "scripts/setup.mjs"
          ? /interactive terminal/
          : file === "src/main.ts"
            ? /Cannot start/
            : /Registration failed/,
      );
      assert(!run.stderr.includes("SyntaxError"));
      assert.deepEqual(fs.readdirSync(dir), []);
      assert(!run.stderr.includes("Bearer"));
    } finally {
      assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
test("setup refuses existing .env without reading/overwriting it", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "forumfern-setup-"));
  assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
  try {
    fs.writeFileSync(path.join(dir, ".env"), "private sentinel");
    const run = spawnSync(
      process.execPath,
      [path.join(root, "scripts/setup.mjs")],
      { cwd: dir, encoding: "utf8", timeout: 10000 },
    );
    assert.equal(run.status, 1);
    assert(!run.stderr.includes("private sentinel"));
    assert.equal(
      fs.readFileSync(path.join(dir, ".env"), "utf8"),
      "private sentinel",
    );
  } finally {
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
