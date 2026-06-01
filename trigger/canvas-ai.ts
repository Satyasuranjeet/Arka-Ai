import { task, logger } from "@trigger.dev/sdk/v3";
import { groqGenerateText } from "./groq";

type CanvasNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

type AnalyzeCanvasPayload = {
  projectId: string;
  projectName?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

/**
 * Background task: analyse a canvas diagram with Groq and return AI insights.
 *
 * Requires GROQ_API_KEY set in Trigger.dev cloud env vars
 * (Dashboard → Project → Environment variables).
 *
 * Trigger from the FastAPI backend:
 *   POST /api/projects/{id}/canvas/analyze
 *
 * Or trigger from the React frontend using useTaskTrigger() from @trigger.dev/react-hooks.
 */
export const analyzeCanvas = task({
  id: "analyze-canvas",
  maxDuration: 300, // seconds — enough headroom for Gemini API calls
  run: async (payload: AnalyzeCanvasPayload) => {
    const { projectId, projectName, nodes, edges } = payload;

    logger.log("Starting canvas analysis", {
      projectId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    // Build a human-readable representation of the diagram
    const nodeLines = nodes
      .map((n) => {
        const label =
          (n.data?.label as string) ?? (n.data?.text as string) ?? n.id;
        return `- Node "${label}" (type: ${n.type})`;
      })
      .join("\n");

    const edgeLines = edges
      .map((e) => {
        const from = (nodes.find((n) => n.id === e.source)?.data?.label as string) ?? e.source;
        const to = (nodes.find((n) => n.id === e.target)?.data?.label as string) ?? e.target;
        const edgeLabel = e.label ? ` [${e.label}]` : "";
        return `- "${from}" → "${to}"${edgeLabel}`;
      })
      .join("\n");

    logger.log("Diagram structure built", { nodeLines, edgeLines });

    // ── Groq ────────────────────────────────────────────────────────────────

    const prompt = [
      `You are a diagram analysis assistant. The user has a canvas diagram called "${projectName ?? projectId}".`,
      "",
      nodes.length > 0 ? `Nodes:\n${nodeLines}` : "The canvas has no nodes yet.",
      edges.length > 0 ? `\nEdges:\n${edgeLines}` : "",
      "",
      "Please provide:",
      "1. A one-sentence summary of what this diagram represents.",
      "2. Up to 3 concrete, actionable suggestions to improve or extend it.",
      "",
      "Reply in JSON with this exact shape:",
      '{ "summary": "...", "suggestions": ["...", "..."] }',
    ]
      .filter(Boolean)
      .join("\n");

    const { text: raw, model } = await groqGenerateText({
      prompt,
      temperature: 0.4,
      expectJson: true,
    });
    logger.log("Groq raw response", { model, raw });

    let summary: string;
    let suggestions: string[];

    try {
      const parsed = JSON.parse(raw);
      summary = parsed.summary ?? "";
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    } catch {
      // Fallback if the model didn't return clean JSON
      summary = raw.slice(0, 200);
      suggestions = [];
    }
    // ────────────────────────────────────────────────────────────────────────

    logger.log("Analysis complete", { summary, suggestions });

    return {
      projectId,
      summary,
      suggestions,
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    };
  },
});
