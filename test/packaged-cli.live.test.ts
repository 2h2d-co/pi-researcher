import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { RpcClient } from "../node_modules/@earendil-works/pi-coding-agent/dist/modes/rpc/rpc-client.js";
import { researchPrompt } from "../extensions/pi-researcher/index.ts";
import manifest from "../package.json" with { type: "json" };
import { archiveEntries, packageArchive } from "./package-archive.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const piVersion = manifest.devDependencies["@earendil-works/pi-coding-agent"];
const model = "gpt-5.6-luna";
const topic = "the content of marker.txt in the working directory";
const marker = "pi-researcher-live-marker";
type NotifyRequest = {
  type: "extension_ui_request";
  method: "notify";
  message: string;
  notifyType: string | undefined;
};

function isNotifyRequest(event: unknown): event is NotifyRequest {
  return (
    typeof event === "object" &&
    event !== null &&
    "type" in event &&
    event.type === "extension_ui_request" &&
    "method" in event &&
    event.method === "notify" &&
    "message" in event &&
    typeof event.message === "string" &&
    (!("notifyType" in event) ||
      event.notifyType === undefined ||
      typeof event.notifyType === "string")
  );
}

const instructions =
  "You are a release test assistant. When a user message asks you to research a topic, " +
  "call the read tool on marker.txt in the working directory exactly once, then reply with " +
  "the exact file content and nothing else.";

test(
  `packaged /research sends a live research request through Pi ${piVersion}`,
  {
    skip: process.env["PI_RESEARCHER_LIVE_TEST"] !== "1",
    timeout: 240_000,
  },
  async (t) => {
    const token = process.env["PI_RESEARCHER_LIVE_API_KEY"];
    assert.ok(token, "PI_RESEARCHER_LIVE_API_KEY is required");
    const temporary = await mkdtemp(join(tmpdir(), "researcher-cli-live-"));
    t.after(() => rm(temporary, { recursive: true, force: true }));
    // A supplied candidate is the release gate's exact archive; it never falls back to packing.
    const archive = await packageArchive(root, temporary, process.env["PI_PACKAGE_ARCHIVE"]);
    const expected = (await readFile(join(root, ".github/npm-package-files"), "utf8"))
      .trim()
      .split("\n")
      .map((file) => `package/${file}`)
      .sort();
    assert.deepEqual(archiveEntries(archive), expected);
    execFileSync("tar", ["-xzf", archive, "-C", temporary]);
    const cli = await realpath(
      process.env["PI_TEST_CLI_PATH"] ??
        join(root, "node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js"),
    );
    const env = {
      HOME: temporary,
      PI_CODING_AGENT_DIR: join(temporary, "agent"),
      PI_OFFLINE: "1",
      PI_TELEMETRY: "0",
      PI_RESEARCHER_LIVE_API_KEY: token,
    };
    assert.equal(
      execFileSync(process.execPath, [cli, "--version"], {
        env: { ...process.env, ...env },
        encoding: "utf8",
      }).trim(),
      piVersion,
      "Live validation requires the Pi version pinned as the development dependency.",
    );
    await mkdir(env.PI_CODING_AGENT_DIR);
    await writeFile(
      join(env.PI_CODING_AGENT_DIR, "models.json"),
      JSON.stringify({
        providers: { "openai-codex": { apiKey: "$PI_RESEARCHER_LIVE_API_KEY" } },
      }),
    );
    await writeFile(
      join(env.PI_CODING_AGENT_DIR, "settings.json"),
      JSON.stringify({
        transport: "sse",
        retry: { enabled: false, provider: { timeoutMs: 60_000, maxRetries: 0 } },
        compaction: { enabled: false },
      }),
    );
    await writeFile(join(env.PI_CODING_AGENT_DIR, "SYSTEM.md"), instructions);
    await writeFile(join(temporary, "marker.txt"), marker);
    const client = new RpcClient({
      cliPath: cli,
      cwd: temporary,
      env,
      provider: "openai-codex",
      model,
      args: [
        "--offline",
        "--no-extensions",
        "--no-skills",
        "--no-prompt-templates",
        "--no-context-files",
        "--tools",
        "read",
        "--thinking",
        "low",
        "--session",
        join(temporary, "session.jsonl"),
        "-e",
        join(temporary, "package"),
      ],
    });
    t.after(async () => client.stop());
    await client.start();

    // An empty topic shows usage and does not start a model request.
    const usage = new Promise<{ message: string; notifyType: string | undefined }>(
      (resolveNotice, rejectNotice) => {
        const timer = setTimeout(() => rejectNotice(new Error("No usage notice")), 30_000);
        // RPC delivers extension UI requests through the event stream, outside its event type.
        const unsubscribe = client.onEvent((event: unknown) => {
          if (isNotifyRequest(event)) {
            clearTimeout(timer);
            unsubscribe();
            resolveNotice({ message: event.message, notifyType: event.notifyType });
          }
        });
      },
    );
    assert.equal(await client.prompt("/research   "), "handled");
    assert.deepEqual(await usage, { message: "Usage: /research <topic>", notifyType: "info" });
    assert.deepEqual(await client.getMessages(), []);

    const events = await client.promptAndWait(`/research ${topic}`, undefined, 120_000);
    assert.deepEqual(
      events.filter((event: { type: string }) => event.type === "extension_error"),
      [],
    );
    const messages = await client.getMessages();
    const user = messages.find((message) => message.role === "user");
    assert.ok(user?.role === "user");
    const text =
      typeof user.content === "string"
        ? user.content
        : user.content.map((block) => (block.type === "text" ? block.text : "")).join("");
    assert.equal(text, researchPrompt(topic));
    const read = messages.find(
      (message) => message.role === "toolResult" && message.toolName === "read",
    );
    assert.ok(read?.role === "toolResult", "The packaged CLI executed Pi's read tool.");
    assert.equal(read.isError, false);
    const assistant = messages.filter((message) => message.role === "assistant").at(-1);
    assert.ok(assistant?.role === "assistant");
    assert.equal(assistant.provider, "openai-codex");
    assert.equal(assistant.model, model);
    assert.equal(assistant.stopReason, "stop", assistant.errorMessage);
    const answer = assistant.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    assert.equal(answer, marker);
    assert.doesNotMatch(client.getStderr(), /Failed to load extension|requires Pi/);
    t.diagnostic(
      `Pi ${piVersion} ${model}: packed extension, usage notice, live research request, and built-in read passed`,
    );
  },
);
