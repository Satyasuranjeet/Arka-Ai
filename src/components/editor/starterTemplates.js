/**
 * Starter template definitions.
 *
 * Each template is a self-contained canvas snapshot — a list of React Flow
 * node objects and edge objects that can be bulk-loaded into the live canvas.
 *
 * @typedef {{ id: string, name: string, description: string,
 *             nodes: import('@xyflow/react').Node[],
 *             edges: import('@xyflow/react').Edge[] }} CanvasTemplate
 */

import { NODE_COLORS, canvasNode, canvasEdge } from '@/constants/canvas'

// ---------------------------------------------------------------------------
// Color aliases — makes template definitions readable at a glance
// ---------------------------------------------------------------------------
const C = {
  default: NODE_COLORS[0], // #1F1F1F / #EDEDED
  blue:    NODE_COLORS[1], // #10233D / #52A8FF
  purple:  NODE_COLORS[2], // #2E1938 / #BF7AF0
  orange:  NODE_COLORS[3], // #331B00 / #FF990A
  red:     NODE_COLORS[4], // #3C1618 / #FF6166
  pink:    NODE_COLORS[5], // #3A1726 / #F75F8F
  green:   NODE_COLORS[6], // #0F2E18 / #62C073
  teal:    NODE_COLORS[7], // #062822 / #0AC7B4
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a canvas node object. */
function node(id, label, shape, color, x, y, w = 140, h = 56) {
  return {
    id,
    type: canvasNode,
    position: { x, y },
    style: { width: w, height: h },
    data: { label, color, shape },
  }
}

/** Build a canvas edge object. */
function edge(id, source, target, label = '') {
  return { id, type: canvasEdge, source, target, data: { label } }
}

// ---------------------------------------------------------------------------
// Template 1 — Microservices Architecture
// ---------------------------------------------------------------------------

const microservicesNodes = [
  node('ms-client',  'Client App',       'rectangle', C.default, 300,   0),
  node('ms-gateway', 'API Gateway',      'rectangle', C.blue,    300, 120),
  node('ms-auth',    'Auth Service',     'pill',      C.purple,    0, 260),
  node('ms-user',    'User Service',     'rectangle', C.green,   220, 260),
  node('ms-order',   'Order Service',    'rectangle', C.orange,  460, 260),
  node('ms-pay',     'Payment Service',  'rectangle', C.teal,    680, 260),
  node('ms-userdb',  'User DB',          'cylinder',  C.default, 220, 380, 140, 56),
  node('ms-orderdb', 'Order DB',         'cylinder',  C.default, 460, 380, 140, 56),
]

const microservicesEdges = [
  edge('me1', 'ms-client',  'ms-gateway'),
  edge('me2', 'ms-gateway', 'ms-auth'),
  edge('me3', 'ms-gateway', 'ms-user'),
  edge('me4', 'ms-gateway', 'ms-order'),
  edge('me5', 'ms-gateway', 'ms-pay'),
  edge('me6', 'ms-user',    'ms-userdb'),
  edge('me7', 'ms-order',   'ms-orderdb'),
]

// ---------------------------------------------------------------------------
// Template 2 — CI/CD Pipeline
// ---------------------------------------------------------------------------

const cicdNodes = [
  node('ci-source', 'Source Code', 'rectangle', C.default,   0, 80),
  node('ci-build',  'Build',       'rectangle', C.blue,    200, 80),
  node('ci-test',   'Test Suite',  'rectangle', C.orange,  400, 80),
  node('ci-stage',  'Staging',     'rectangle', C.purple,  600, 80),
  node('ci-prod',   'Production',  'rectangle', C.green,   800, 80),
]

const cicdEdges = [
  edge('ce1', 'ci-source', 'ci-build',  'push'),
  edge('ce2', 'ci-build',  'ci-test',   'artifact'),
  edge('ce3', 'ci-test',   'ci-stage',  'passed'),
  edge('ce4', 'ci-stage',  'ci-prod',   'approved'),
]

// ---------------------------------------------------------------------------
// Template 3 — Event-Driven System
// ---------------------------------------------------------------------------

const eventNodes = [
  node('ev-producer',  'Producer',      'pill',      C.blue,      0, 160, 160, 56),
  node('ev-bus',       'Event Bus',     'rectangle', C.purple,  240, 160, 160, 56),
  node('ev-consumerA', 'Consumer A',    'rectangle', C.green,   480,   0),
  node('ev-consumerB', 'Consumer B',    'rectangle', C.teal,    480, 160),
  node('ev-consumerC', 'Consumer C',    'rectangle', C.orange,  480, 320),
  node('ev-dlq',       'Dead Letter Q', 'rectangle', C.red,     480, 440),
]

const eventEdges = [
  edge('ee1', 'ev-producer',  'ev-bus'),
  edge('ee2', 'ev-bus',       'ev-consumerA', 'event'),
  edge('ee3', 'ev-bus',       'ev-consumerB', 'event'),
  edge('ee4', 'ev-bus',       'ev-consumerC', 'event'),
  edge('ee5', 'ev-bus',       'ev-dlq',       'failed'),
]

// ---------------------------------------------------------------------------
// Exported collection
// ---------------------------------------------------------------------------

/** @type {CanvasTemplate[]} */
export const CANVAS_TEMPLATES = [
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description:
      'API Gateway routing traffic to Auth, User, Order, and Payment services, each backed by their own data store.',
    nodes: microservicesNodes,
    edges: microservicesEdges,
  },
  {
    id: 'cicd',
    name: 'CI/CD Pipeline',
    description:
      'End-to-end deployment pipeline from source code through build, test, staging, and production environments.',
    nodes: cicdNodes,
    edges: cicdEdges,
  },
  {
    id: 'event-driven',
    name: 'Event-Driven System',
    description:
      'Producer publishing to a central Event Bus consumed by multiple downstream services, with a dead-letter queue for failures.',
    nodes: eventNodes,
    edges: eventEdges,
  },
]
