import { VERSION, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

const EXTENSION_ID = "pi-researcher";

export const MINIMUM_PI_VERSION = "1.0.0";

/** Compare dotted numeric release versions; prerelease suffixes rank below their release. */
export function atLeastVersion(version: unknown, minimum: string): boolean {
  if (typeof version !== "string") return false;
  const match = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/.exec(version);
  if (!match) return false;
  const actual = [Number(match[1]), Number(match[2]), Number(match[3])];
  const required = minimum.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    const left = actual[index] ?? 0;
    const right = required[index] ?? 0;
    if (left !== right) return left > right;
  }
  return match[4] === undefined;
}

/**
 * Refuse to load on a Pi runtime older than the release this version targets.
 * Pi installs packages without resolving peer dependencies, so the peer range
 * alone does not stop an older Pi from loading the extension.
 */
export function requirePiVersion(extension: string, version: unknown = VERSION): void {
  if (atLeastVersion(version, MINIMUM_PI_VERSION)) return;
  const reported = typeof version === "string" ? `Pi ${version}` : "no Pi version";
  throw new Error(
    `${extension} requires Pi ${MINIMUM_PI_VERSION} or later, but the running Pi reports ` +
      `${reported}. Exit Pi and start Pi ${MINIMUM_PI_VERSION} or later. ` +
      "/reload cannot upgrade the running runtime.",
  );
}

/** Build the user message that `/research` sends for a topic. */
export function researchPrompt(topic: string): string {
  return `Research the following topic thoroughly and summarize key findings, important sources, and open questions:\n\n${topic}`;
}

/** Send a research request for the command arguments, or show usage when no topic is given. */
export function startResearch(
  args: string | undefined,
  notify: (message: string, type: "info") => void,
  send: (content: string) => void,
): void {
  const topic = (args ?? "").trim();
  if (!topic) {
    notify("Usage: /research <topic>", "info");
    return;
  }
  send(researchPrompt(topic));
}

export type ResearcherApi = Pick<ExtensionAPI, "registerCommand" | "sendUserMessage">;

export default function piResearcher(pi: ResearcherApi) {
  requirePiVersion(EXTENSION_ID);
  pi.registerCommand("research", {
    description: "Start a research request with pi-researcher",
    handler: async (args, ctx) => {
      startResearch(
        args,
        (message, type) => ctx.ui.notify(message, type),
        (content) => pi.sendUserMessage(content),
      );
    },
  });
}
