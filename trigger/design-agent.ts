import { task, logger } from "@trigger.dev/sdk/v3";
import { groqGenerateText } from "./groq";

type DesignAgentPayload = {
  prompt: string;
  room_id: string;
  project_id: string;
};

type NodeColor = {
  fill: string;
  text: string;
  label: string;
};

type CanvasNode = {
  id: string;
  type: "canvasNode";
  position: { x: number; y: number };
  data: {
    label: string;
    color: NodeColor;
    shape: NodeShape;
  };
  style?: { width?: number; height?: number };
};

type CanvasEdge = {
  id: string;
  type: "canvasEdge";
  source: string;
  target: string;
  data?: { label?: string };
};

type NodeShape = "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon";

type AgentPlan = {
  nodes?: Partial<CanvasNode>[];
  edges?: Partial<CanvasEdge>[];
};

const LIVEBLOCKS_API = "https://api.liveblocks.io/v2";
const AGENT_ID = "ghost-ai";
const FLOW_KEY = "flow";

const NODE_COLORS: NodeColor[] = [
  { fill: "#1F1F1F", text: "#EDEDED", label: "Default" },
  { fill: "#10233D", text: "#52A8FF", label: "Blue" },
  { fill: "#2E1938", text: "#BF7AF0", label: "Purple" },
  { fill: "#331B00", text: "#FF990A", label: "Orange" },
  { fill: "#3C1618", text: "#FF6166", label: "Red" },
  { fill: "#3A1726", text: "#F75F8F", label: "Pink" },
  { fill: "#0F2E18", text: "#62C073", label: "Green" },
  { fill: "#062822", text: "#0AC7B4", label: "Teal" },
];

const SHAPES: NodeShape[] = ["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"];

const DEFAULT_SIZES: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 180, height: 80 },
  diamond: { width: 120, height: 120 },
  circle: { width: 88, height: 88 },
  pill: { width: 170, height: 64 },
  cylinder: { width: 110, height: 104 },
  hexagon: { width: 130, height: 92 },
};

function liveblocksSecret() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set in the Trigger.dev environment.");
  return secret;
}

function headers() {
  return {
    Authorization: `Bearer ${liveblocksSecret()}`,
    "Content-Type": "application/json",
  };
}

async function liveblocksFetch(roomId: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${LIVEBLOCKS_API}/rooms/${encodeURIComponent(roomId)}${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Liveblocks ${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function setPresence(roomId: string, data: Record<string, unknown>, ttl = 30) {
  await liveblocksFetch(roomId, "/presence", {
    method: "POST",
    body: JSON.stringify({
      userId: AGENT_ID,
      data,
      userInfo: {
        name: "Arka Ai",
        avatar: "",
        color: "#8b82ff",
      },
      ttl,
    }),
  });
}

async function broadcastStatus(roomId: string, phase: string, message: string, extra: Record<string, unknown> = {}) {
  await liveblocksFetch(roomId, "/broadcast_event", {
    method: "POST",
    body: JSON.stringify({
      type: "ai-status-feed",
      phase,
      text: message,
      message,
      at: new Date().toISOString(),
      ...extra,
    }),
  });
}

async function getStorage(roomId: string) {
  return liveblocksFetch(roomId, "/storage?format=json");
}

async function patchStorage(roomId: string, operations: Record<string, unknown>[]) {
  if (operations.length === 0) return;
  await liveblocksFetch(roomId, "/storage/json-patch", {
    method: "PATCH",
    body: JSON.stringify(operations),
  });
}

function flowFromStorage(storage: any) {
  const flow = storage?.[FLOW_KEY] ?? {};
  const nodesMap = flow.nodes ?? {};
  const edgesMap = flow.edges ?? {};
  return {
    nodes: Object.values(nodesMap) as CanvasNode[],
    edges: Object.values(edgesMap) as CanvasEdge[],
  };
}

function safeId(prefix: string, raw: unknown, index: number) {
  const base = String(raw || `${prefix}-${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `ai-${base || `${prefix}-${index + 1}`}`;
}

function pickShape(raw: unknown, index: number): NodeShape {
  if (typeof raw === "string" && SHAPES.includes(raw as NodeShape)) return raw as NodeShape;
  return SHAPES[index % SHAPES.length];
}

function pickColor(raw: unknown, index: number): NodeColor {
  if (typeof raw === "string") {
    const byLabel = NODE_COLORS.find((c) => c.label.toLowerCase() === raw.toLowerCase());
    if (byLabel) return byLabel;
  }
  if (raw && typeof raw === "object") {
    const candidate = raw as Partial<NodeColor>;
    const byFill = NODE_COLORS.find((c) => c.fill === candidate.fill && c.text === candidate.text);
    if (byFill) return byFill;
  }
  return NODE_COLORS[(index % (NODE_COLORS.length - 1)) + 1] ?? NODE_COLORS[0];
}

function normalizeNode(raw: Partial<CanvasNode>, index: number, existingIds: Set<string>): CanvasNode {
  const label = String(raw.data?.label || raw.id || `Component ${index + 1}`).slice(0, 80);
  let id = safeId("node", raw.id ?? label, index);
  let suffix = 1;
  while (existingIds.has(id)) {
    id = `${safeId("node", raw.id ?? label, index)}-${suffix++}`;
  }
  existingIds.add(id);

  const shape = pickShape(raw.data?.shape, index);
  const size = DEFAULT_SIZES[shape];
  const x = Number.isFinite(raw.position?.x) ? Number(raw.position?.x) : 80 + (index % 4) * 240;
  const y = Number.isFinite(raw.position?.y) ? Number(raw.position?.y) : 80 + Math.floor(index / 4) * 170;

  return {
    id,
    type: "canvasNode",
    position: { x, y },
    style: {
      width: Number(raw.style?.width) || size.width,
      height: Number(raw.style?.height) || size.height,
    },
    data: {
      label,
      shape,
      color: pickColor(raw.data?.color, index),
    },
  };
}

function normalizeEdge(raw: Partial<CanvasEdge>, index: number, nodeIds: string[], idMap: Map<string, string>): CanvasEdge | null {
  const source = idMap.get(String(raw.source)) ?? String(raw.source ?? "");
  const target = idMap.get(String(raw.target)) ?? String(raw.target ?? "");
  if (!nodeIds.includes(source) || !nodeIds.includes(target) || source === target) return null;

  return {
    id: safeId("edge", raw.id || `${source}-${target}`, index),
    type: "canvasEdge",
    source,
    target,
    data: { label: String(raw.data?.label ?? "").slice(0, 48) },
  };
}

function normalizePlan(plan: AgentPlan, existing: { nodes: CanvasNode[]; edges: CanvasEdge[] }) {
  const existingIds = new Set(existing.nodes.map((n) => n.id));
  const idMap = new Map<string, string>();
  const rawNodes = Array.isArray(plan.nodes) ? plan.nodes.slice(0, 12) : [];
  const nodes = rawNodes.map((node, index) => {
    const normalized = normalizeNode(node, index, existingIds);
    if (node.id) idMap.set(String(node.id), normalized.id);
    return normalized;
  });

  const allNodeIds = [...existing.nodes.map((n) => n.id), ...nodes.map((n) => n.id)];
  const rawEdges = Array.isArray(plan.edges) ? plan.edges.slice(0, 16) : [];
  const edges = rawEdges
    .map((edge, index) => normalizeEdge(edge, index, allNodeIds, idMap))
    .filter((edge): edge is CanvasEdge => edge !== null);

  return { nodes, edges };
}

function buildPatch(nodes: CanvasNode[], edges: CanvasEdge[], storage: any) {
  const operations: Record<string, unknown>[] = [];

  if (!storage?.[FLOW_KEY]) {
    operations.push({ op: "add", path: `/${FLOW_KEY}`, value: { nodes: {}, edges: {} } });
  } else {
    if (!storage[FLOW_KEY].nodes) operations.push({ op: "add", path: `/${FLOW_KEY}/nodes`, value: {} });
    if (!storage[FLOW_KEY].edges) operations.push({ op: "add", path: `/${FLOW_KEY}/edges`, value: {} });
  }

  for (const node of nodes) {
    operations.push({ op: "add", path: `/${FLOW_KEY}/nodes/${node.id}`, value: node });
  }

  for (const edge of edges) {
    operations.push({ op: "add", path: `/${FLOW_KEY}/edges/${edge.id}`, value: edge });
  }

  return operations;
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? "{}";
}

async function generatePlan(prompt: string, canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] }) {
  const promptText = [
    "You are Arka Ai, an architecture diagram design agent for a React Flow canvas.",
    "Return only JSON. Do not include markdown.",
    "Create or extend a system design using only these node shapes: rectangle, diamond, circle, pill, cylinder, hexagon.",
    "Use only these color labels: Default, Blue, Purple, Orange, Red, Pink, Green, Teal.",
    "Return this exact JSON shape:",
    '{"nodes":[{"id":"short-id","position":{"x":80,"y":80},"style":{"width":180,"height":80},"data":{"label":"API Gateway","shape":"pill","color":"Blue"}}],"edges":[{"id":"edge-id","source":"short-id","target":"other-id","data":{"label":"HTTPS"}}]}',
    "Keep positions on a simple grid with at least 180px horizontal spacing and 130px vertical spacing.",
    `Current canvas: ${JSON.stringify(canvas)}`,
    `User prompt: ${prompt}`,
  ].join("\n");

  const { text, model } = await groqGenerateText({
    prompt: promptText,
    temperature: 0.35,
    expectJson: true,
  });

  logger.log("Groq plan generated", { model });
  return JSON.parse(extractJson(text)) as AgentPlan;
}

/**
 * Full design agent background task.
 *
 * Triggered via:  POST /api/ai/design
 * Token issued via: POST /api/ai/design/token
 */
export const designAgent = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload) => {
    const { prompt, room_id, project_id } = payload;

    logger.log("Design agent started", { room_id, project_id, prompt });

    try {
      await setPresence(room_id, {
        cursor: { x: 120, y: 80 },
        thinking: true,
        status: "Arka Ai is scanning the canvas...",
      });
      await broadcastStatus(room_id, "start", "Arka Ai is scanning the canvas...");

      const storage = await getStorage(room_id);
      const canvas = flowFromStorage(storage);

      await setPresence(room_id, {
        cursor: { x: 320, y: 160 },
        thinking: true,
        status: "Generating microservices layout structure...",
      });
      await broadcastStatus(room_id, "processing", "Generating microservices layout structure...");

      const plan = await generatePlan(prompt, canvas);
      const { nodes, edges } = normalizePlan(plan, canvas);
      const operations = buildPatch(nodes, edges, storage);

      await setPresence(room_id, {
        cursor: nodes[0]?.position ?? { x: 520, y: 260 },
        thinking: true,
        status: "Applying design to the shared canvas...",
      });
      await patchStorage(room_id, operations);

      const added = nodes.length + edges.length;
      await broadcastStatus(room_id, "complete", `Design complete! Added ${added} elements.`, {
        addedNodes: nodes.length,
        addedEdges: edges.length,
      });
      await setPresence(room_id, {
        cursor: null,
        thinking: false,
        status: "Design complete",
      }, 5);

      logger.log("Design agent completed", {
        room_id,
        project_id,
        addedNodes: nodes.length,
        addedEdges: edges.length,
      });

      return {
        status: "ok",
        project_id,
        room_id,
        addedNodes: nodes.length,
        addedEdges: edges.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown design-agent error";
      logger.error("Design agent failed", { room_id, project_id, message });

      await broadcastStatus(room_id, "error", `Arka Ai could not finish: ${message}`).catch(() => undefined);
      await setPresence(room_id, {
        cursor: null,
        thinking: false,
        status: "Design failed",
      }, 5).catch(() => undefined);

      throw error;
    }
  },
});
