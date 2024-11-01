import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets
} from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import { CommentPlugin, CommentExtensions } from "rete-comment-plugin";

class Node extends ClassicPreset.Node {
  width = 180;
  height = 140;
}
class Connection<N extends Node> extends ClassicPreset.Connection<N, N> {}

type Schemes = GetSchemes<Node, Connection<Node>>;
type AreaExtra = ReactArea2D<Schemes>;

export async function createEditor(container: HTMLElement) {
  const socket = new ClassicPreset.Socket("socket");

  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
  const comment = new CommentPlugin<Schemes, AreaExtra>();

  const selector = AreaExtensions.selector();
  const accumulating = AreaExtensions.accumulateOnCtrl();

  AreaExtensions.selectableNodes(area, selector, { accumulating });

  render.addPreset(Presets.classic.setup());

  connection.addPreset(ConnectionPresets.classic.setup());

  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(comment);

  AreaExtensions.simpleNodesOrder(area);

  CommentExtensions.selectable(comment, selector, accumulating);

  const a = new Node("A");
  a.addControl("a", new ClassicPreset.InputControl("text", {}));
  a.addOutput("a", new ClassicPreset.Output(socket));
  await editor.addNode(a);

  const b = new Node("B");
  b.addControl("b", new ClassicPreset.InputControl("text", {}));
  b.addInput("b", new ClassicPreset.Input(socket));
  await editor.addNode(b);

  await editor.addConnection(new Connection(a, "a", b, "b"));

  await area.translate(a.id, { x: 0, y: 0 });
  await area.translate(b.id, { x: 270, y: 0 });

  comment.addInline("Inline", [360, -20], b.id);
  comment.addFrame("Frame", [a.id]);

  setTimeout(() => {
    AreaExtensions.zoomAt(area, editor.getNodes());
  }, 10);
  return {
    destroy: () => area.destroy()
  };
}
