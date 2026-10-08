import assert from "node:assert/strict";
import test from "node:test";
import { VERSION } from "@earendil-works/pi-coding-agent";
import piResearcher, {
  atLeastVersion,
  requirePiVersion,
  researchPrompt,
  startResearch,
  type ResearcherApi,
} from "../extensions/pi-researcher/index.ts";

test("requires Pi 1.1.0 or later at load time", () => {
  for (const version of ["1.1.0", "1.1.1", "1.2.0", "2.0.0"]) {
    assert.equal(atLeastVersion(version, "1.1.0"), true, version);
  }
  for (const version of [
    "0.84.3",
    "0.99.2",
    "1.0.0",
    "1.0.4",
    "1.1.0-rc.1",
    "",
    "latest",
    undefined,
  ]) {
    assert.equal(atLeastVersion(version, "1.1.0"), false, String(version));
  }
  assert.doesNotThrow(() => requirePiVersion("pi-researcher", VERSION));
  assert.throws(() => requirePiVersion("pi-researcher", "0.84.3"), {
    message:
      "pi-researcher requires Pi 1.1.0 or later, but the running Pi reports Pi 0.84.3. " +
      "Exit Pi and start Pi 1.1.0 or later. /reload cannot upgrade the running runtime.",
  });
});

test("registers the /research command on the running Pi", () => {
  const commands: { name: string; description: string | undefined }[] = [];
  const api: ResearcherApi = {
    registerCommand: (name, options) => {
      commands.push({ name, description: options.description });
    },
    sendUserMessage: () => {
      assert.fail("Loading the extension must not send a message.");
    },
  };
  piResearcher(api);
  assert.deepEqual(commands, [
    { name: "research", description: "Start a research request with pi-researcher" },
  ]);
});

test("sends the trimmed topic as a research request", () => {
  const sent: string[] = [];
  startResearch(
    "  compare Bun and Node.js  ",
    () => assert.fail("A topic must not show usage."),
    (content) => sent.push(content),
  );
  assert.deepEqual(sent, [researchPrompt("compare Bun and Node.js")]);
  assert.equal(
    sent[0],
    "Research the following topic thoroughly and summarize key findings, important sources, and open questions:\n\ncompare Bun and Node.js",
  );
});

test("shows usage instead of sending an empty research request", () => {
  for (const args of [undefined, "", "   "]) {
    const notices: [string, string][] = [];
    startResearch(
      args,
      (message, type) => notices.push([message, type]),
      () => assert.fail("An empty topic must not send a message."),
    );
    assert.deepEqual(notices, [["Usage: /research <topic>", "info"]], String(args));
  }
});
