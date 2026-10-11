import type { GraphClient } from '@poietic-tech/graphing-library';
import type { storyFrames } from './story-scenes';

type StoryGraph = (typeof storyFrames)[number]['graph'];

// Reveal into the mounted engine: loading every scene would discard existing positions.
export function revealStoryGraph(client: GraphClient, previous: StoryGraph | null, next: StoryGraph) {
  if (!previous) {
    client.load(JSON.stringify(next));
  } else {
    const nodes = new Set(next.nodes.map(n => n.id));
    const edges = new Set(next.edges.map(e => e.id));
    for (const edge of previous.edges) if (!edges.has(edge.id)) client.removeEdge(edge.id);
    for (const node of previous.nodes) if (!nodes.has(node.id)) client.removeNode(node.id);
    if (client.previewNodes(next.nodes[0].id, next)) client.commitPreview();
  }
  client.fitView();
}
