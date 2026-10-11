import type { GraphClient } from '@poietic-tech/graphing-library';

export function focusCaseGraph(client: GraphClient, id: string, reducedMotion: boolean) {
  // Measure the full layout without showing an intermediate camera jump.
  const previous = client.cameraPose();
  client.fitView();
  const overview = client.cameraPose();
  client.setCameraPose(previous, false);
  client.focus(id);
  // The library normally zooms into the immediate neighborhood. Keep the wider
  // context, especially for isolated report/note nodes, while moving to the node.
  client.setCameraPose({ distance: Math.max(previous.distance, overview.distance * .85) }, !reducedMotion);
}
