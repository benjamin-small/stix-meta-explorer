import type { GraphClient } from '@poietic-tech/graphing-library';

export function fitStoryGraph(client: GraphClient) {
  client.fitView();
  // Leave breathing room for node shapes and labels at the canvas edges.
  client.zoom(.85);
}

// A reveal starts a force-layout transition. Its final bounds are not available
// at the initial fit, so keep framing the whole scene until positions settle.
// Manual pan/zoom/drag cancels this session; the next scene starts a fresh one.
export function followStoryLayout(client: GraphClient) {
  let frame = 0;
  let started: number | undefined;
  let lastFit = -Infinity;
  let stableSince = 0;
  let previous: ReturnType<GraphClient['graphNodes']> = [];
  const tick = (now: number) => {
    started ??= now;
    if (now - lastFit >= 100) {
      const nodes = client.graphNodes();
      const stable = nodes.length === previous.length && nodes.every((node, index) => {
        const old = previous[index];
        return node.id === old.id && node.x !== null && node.y !== null && old.x !== null && old.y !== null &&
          Math.abs(node.x - old.x) < .5 && Math.abs(node.y - old.y) < .5;
      });
      if (!stable) stableSince = now;
      fitStoryGraph(client);
      previous = client.graphNodes();
      lastFit = now;
      if ((now - started >= 750 && now - stableSince >= 300) || now - started >= 10000) return;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
