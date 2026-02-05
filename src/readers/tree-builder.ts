import type { TraceEvent, TraceTreeNode } from "../types.ts";

export function buildTree(events: TraceEvent[]): TraceTreeNode {
  const nodeMap = new Map<string, TraceTreeNode>();
  let root: TraceTreeNode | null = null;

  for (const event of events) {
    switch (event.type) {
      case "trace:start": {
        root = {
          type: "trace",
          id: event.id,
          name: event.name,
          status: "in_progress",
          ts: event.ts,
          children: [],
        };
        nodeMap.set(event.id, root);
        break;
      }
      case "trace:end": {
        if (root) {
          root.status = event.status;
          root.duration = event.duration;
          if (event.error) root.error = event.error;
        }
        break;
      }
      case "span:start": {
        const node: TraceTreeNode = {
          type: "span",
          id: event.id,
          name: event.name,
          status: "in_progress",
          ts: event.ts,
          children: [],
        };
        nodeMap.set(event.id, node);
        const parent = nodeMap.get(event.parent);
        if (parent) parent.children.push(node);
        break;
      }
      case "span:end": {
        const node = nodeMap.get(event.id);
        if (node) {
          node.status = event.status;
          node.duration = event.duration;
          if (event.error) node.error = event.error;
        }
        break;
      }
      case "checkpoint": {
        const node: TraceTreeNode = {
          type: "checkpoint",
          name: event.name,
          ts: event.ts,
          data: event.data,
          children: [],
        };
        const parent = nodeMap.get(event.parent);
        if (parent) parent.children.push(node);
        break;
      }
    }
  }

  return root ?? { type: "trace", name: "unknown", status: "in_progress", ts: 0, children: [] };
}
