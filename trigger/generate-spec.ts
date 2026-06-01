import { task, logger } from "@trigger.dev/sdk/v3";
import { groqGenerateText } from "./groq";

type SpecPayload = {
  project_id: string;
  room_id: string;
  chatHistory?: Array<{ role?: string; content?: string }>;
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
};

const LIVEBLOCKS_API = "https://api.liveblocks.io/v2";

function liveblocksSecret() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set in Trigger.dev env.");
  return secret;
}

async function broadcastStatus(roomId: string, phase: string, message: string) {
  const res = await fetch(`${LIVEBLOCKS_API}/rooms/${encodeURIComponent(roomId)}/broadcast_event`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${liveblocksSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "ai-status-feed",
      phase,
      text: message,
      message,
      at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Liveblocks broadcast failed: ${res.status} ${body}`);
  }
}

function summarizeNodes(nodes: Array<Record<string, unknown>>) {
  return nodes.slice(0, 40).map((node, i) => {
    const id = String(node.id ?? `n${i + 1}`);
    const data = (node.data ?? {}) as Record<string, unknown>;
    const label = String(data.label ?? id);
    const shape = String(data.shape ?? "rectangle");
    const pos = (node.position ?? {}) as { x?: number; y?: number };
    return `- ${label} (id: ${id}, shape: ${shape}, x: ${pos.x ?? 0}, y: ${pos.y ?? 0})`;
  });
}

function summarizeEdges(edges: Array<Record<string, unknown>>) {
  return edges.slice(0, 60).map((edge, i) => {
    const id = String(edge.id ?? `e${i + 1}`);
    const source = String(edge.source ?? "unknown");
    const target = String(edge.target ?? "unknown");
    const data = (edge.data ?? {}) as Record<string, unknown>;
    const label = String(data.label ?? "").trim();
    return `- ${source} -> ${target}${label ? ` [${label}]` : ""} (id: ${id})`;
  });
}

function summarizeChat(chat: Array<{ role?: string; content?: string }>) {
  return chat
    .slice(-20)
    .map((m) => `- ${String(m.role ?? "user")}: ${String(m.content ?? "").slice(0, 500)}`);
}

async function generateMarkdownSpec(payload: SpecPayload) {
  const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
  const edges = Array.isArray(payload.edges) ? payload.edges : [];
  const chatHistory = Array.isArray(payload.chatHistory) ? payload.chatHistory : [];

  const prompt = [
    "You are a principal software architect writing a technical architecture specification in Markdown.",
    "Output must be plain Markdown only.",
    "Use this exact section order:",
    "# System Architecture Specification",
    "## Overview",
    "## Functional Requirements",
    "## Architecture Components",
    "## Data Flow",
    "## Non-Functional Requirements",
    "## Risks and Open Questions",
    "## Implementation Plan",
    "",
    `Project ID: ${payload.project_id}`,
    `Room ID: ${payload.room_id}`,
    "",
    "Canvas Nodes:",
    ...summarizeNodes(nodes),
    "",
    "Canvas Edges:",
    ...summarizeEdges(edges),
    "",
    "Recent Chat History:",
    ...summarizeChat(chatHistory),
    "",
    "Use concise but specific engineering language and include practical details.",
  ].join("\n");

  const { text, model } = await groqGenerateText({
    prompt,
    temperature: 0.35,
  });

  logger.log("Groq spec generated", { model });
  return text;
}

export const generateSpec = task({
  id: "generate-spec",
  maxDuration: 300,
  run: async (payload: SpecPayload) => {
    const roomId = payload.room_id;
    logger.log("Spec generation started", {
      roomId,
      projectId: payload.project_id,
      nodes: payload.nodes?.length ?? 0,
      edges: payload.edges?.length ?? 0,
    });

    try {
      await broadcastStatus(roomId, "start", "Arka Ai is preparing your architecture specification...");
      await broadcastStatus(roomId, "processing", "Analyzing canvas and conversation context...");

      const markdown = await generateMarkdownSpec(payload);

      await broadcastStatus(roomId, "complete", "Specification draft generated successfully.");
      logger.log("Spec generation completed", {
        roomId,
        projectId: payload.project_id,
        chars: markdown.length,
      });

      return {
        status: "ok",
        project_id: payload.project_id,
        room_id: roomId,
        markdown,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown generate-spec error";
      logger.error("Spec generation failed", {
        roomId,
        projectId: payload.project_id,
        message,
      });
      await broadcastStatus(roomId, "error", `Spec generation failed: ${message}`).catch(() => undefined);
      throw error;
    }
  },
});
