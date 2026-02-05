import type { SerializedError, TraceEvent, TraceTreeNode } from "../types.ts";

export function buildTree(events: TraceEvent[]): TraceTreeNode {
  const nodeMap = new Map<string, TraceTreeNode>();
  let root: TraceTreeNode | null = null;

  for (const event of events) {
    switch (event.type) {
      case "trace:start": {
        root = {
          type: "trace",
          id: event.id as string,
          name: event.name as string,
          status: "in_progress",
          ts: event.ts,
          children: [],
        };
        nodeMap.set(event.id as string, root);
        break;
      }
      case "trace:end": {
        if (root) {
          root.status = event.status as "ok" | "error";
          root.duration = event.duration as number;
          if (event.error) root.error = event.error as SerializedError;
        }
        break;
      }
      case "span:start": {
        const node: TraceTreeNode = {
          type: "span",
          id: event.id as string,
          name: event.name as string,
          status: "in_progress",
          ts: event.ts,
          children: [],
        };
        nodeMap.set(event.id as string, node);
        const parent = nodeMap.get(event.parent as string);
        if (parent) parent.children.push(node);
        break;
      }
      case "span:end": {
        const node = nodeMap.get(event.id as string);
        if (node) {
          node.status = event.status as "ok" | "error";
          node.duration = event.duration as number;
          if (event.error) node.error = event.error as SerializedError;
        }
        break;
      }
      case "checkpoint": {
        const node: TraceTreeNode = {
          type: "checkpoint",
          name: event.name as string,
          ts: event.ts,
          data: event.data,
          children: [],
        };
        const parent = nodeMap.get(event.parent as string);
        if (parent) parent.children.push(node);
        break;
      }
    }
  }

  return root ?? { type: "trace", name: "unknown", status: "in_progress", ts: 0, children: [] };
}
