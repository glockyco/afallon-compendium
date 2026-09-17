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
  const factory: MapRendererFactory = () => {
    const { promise, resolve } = Promise.withResolvers<MapAdapter>();
    releases.push(resolve);
    return promise;
  };
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

test("an obsolete renderer failure cannot replace a working renderer with the fallback", async () => {
  const pending = Promise.withResolvers<MapAdapter>();
  const active = adapter(() => {});
  const errors: string[] = [];
  let attempt = 0;
  const controller = new MapRendererController((message) => { if (message) errors.push(message); }, () => ++attempt === 1 ? pending.promise : Promise.resolve(active));
  const obsolete = controller.replace(canvas, view, callbacks);
  await controller.replace(canvas, view, callbacks);
  pending.reject(new Error("context unavailable"));
  await obsolete;
  expect(controller.adapter).toBe(active);
  expect(errors).toEqual([]);
  controller.destroy();
});
