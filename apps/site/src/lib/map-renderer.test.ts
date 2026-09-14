import { expect, test } from "bun:test";
import { MapRendererController, type AdapterCallbacks, type MapAdapter, type MapRendererFactory } from "./map-renderer";

const canvas = {} as HTMLCanvasElement;
const view = { target: [0, 0, 0] as [number, number, number], zoom: 1 };
const callbacks = {} as AdapterCallbacks;

function adapter(onDestroy: () => void): MapAdapter {
  return { update() {}, setView() {}, destroy: onDestroy };
}

test("destroys replaced, stale, and final deck renderers", async () => {
  let destroyed = 0;
  const releases: Array<(value: MapAdapter) => void> = [];
  const factory: MapRendererFactory = async () => new Promise<MapAdapter>((resolve) => { releases.push(resolve); });
  const controller = new MapRendererController(() => {}, factory);
  const first = controller.replace(canvas, view, callbacks);
  const second = controller.replace(canvas, view, callbacks);
  releases[0]!(adapter(() => { destroyed++; }));
  await first;
  releases[1]!(adapter(() => { destroyed++; }));
  await second;
  expect(destroyed).toBe(1);
  controller.destroy();
  expect(destroyed).toBe(2);
  expect(controller.adapter).toBeNull();
});

test("reports WebGL fallback without retaining a renderer", async () => {
  const messages: string[] = [];
  const controller = new MapRendererController((message) => messages.push(message), async () => { throw new Error("context unavailable"); });
  expect(await controller.replace(canvas, view, callbacks)).toBeNull();
  expect(messages).toEqual(["WebGL map unavailable: context unavailable"]);
  controller.destroy();
});
