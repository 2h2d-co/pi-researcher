import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("research", {
    description: "Start a research request with pi-researcher",
    handler: async (args, ctx) => {
      const topic = (args ?? "").trim();

      if (!topic) {
        ctx.ui.notify("Usage: /research <topic>", "info");
        return;
      }

      pi.sendUserMessage(
        `Research the following topic thoroughly and summarize key findings, important sources, and open questions:\n\n${topic}`,
      );
    },
  });
}
