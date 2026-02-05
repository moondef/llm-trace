import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTree } from "./tree-builder.ts";

describe("buildTree", () => {
  it("builds simple trace", () => {
    const events = [
      { type: "trace:start", id: "t-1", name: "test", ts: 1000 },
      { type: "checkpoint", parent: "t-1", name: "data", data: { x: 1 }, ts: 1010 },
      { type: "trace:end", id: "t-1", duration: 50, status: "ok", ts: 1050 },
    ];
    const tree = buildTree(events);
    assert.equal(tree.name, "test");
    assert.equal(tree.status, "ok");
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].name, "data");
  });

  it("builds nested spans", () => {
    const events = [
      { type: "trace:start", id: "t-1", name: "test", ts: 1000 },
      { type: "span:start", id: "s-1", parent: "t-1", name: "outer", ts: 1010 },
      { type: "span:start", id: "s-2", parent: "s-1", name: "inner", ts: 1020 },
      { type: "checkpoint", parent: "s-2", name: "deep", data: {}, ts: 1025 },
      { type: "span:end", id: "s-2", duration: 10, status: "ok", ts: 1030 },
      { type: "span:end", id: "s-1", duration: 25, status: "ok", ts: 1035 },
      { type: "trace:end", id: "t-1", duration: 40, status: "ok", ts: 1040 },
    ];
    const tree = buildTree(events);
    assert.equal(tree.children[0].children[0].children[0].name, "deep");
  });

  it("handles in-progress trace", () => {
    const tree = buildTree([{ type: "trace:start", id: "t-1", name: "test", ts: 1000 }]);
    assert.equal(tree.status, "in_progress");
  });
});
