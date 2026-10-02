import { expect, test } from "bun:test";
import type { CatalogFacts, CatalogNpcFlightNetwork } from "@afallon/contracts/catalog";
import { flightNetworks, npcFlights } from "./flight-network";

const stops = ["First", "Second", "Third"].map((name, index) => ({ id: name.toLowerCase(), name, landingPosition: { x: index, y: 0, z: 0 }, landingYaw: 0, knownInitially: index === 0 }));
const flight = (stopId: string, sceneName = "Overworld"): CatalogNpcFlightNetwork => ({
  resourcePath: null, stopId, interactionDistance: null, networkId: "Network", sceneName,
  mapWorldBounds: { x: 0, y: 0, width: 10, height: 10 }, minimumFlyoverHeight: 10, currency: null,
  stops, routes: [
    { from: "first", to: "second", bidirectional: false, fare: 2, speed: 32, departureCruiseWaypoint: 0, arrivalCruiseWaypoint: 0, waypoints: [] },
    { from: "second", to: "third", bidirectional: true, fare: 3, speed: 32, departureCruiseWaypoint: 0, arrivalCruiseWaypoint: 0, waypoints: [] },
  ],
});

test("flight networks keep scenes distinct and only offer routes in their authored direction", () => {
  const facts = { npcs: [
    { entityKey: "npcs:1", flightNetwork: flight("first") },
    { entityKey: "npcs:2", flightNetwork: flight("second") },
    { entityKey: "npcs:3", flightNetwork: flight("third") },
    { entityKey: "npcs:4", flightNetwork: flight("first", "Test Area") },
  ] } as CatalogFacts;
  const resolve = (endpoint: { entityKey: string | null; label: string | null }) => endpoint.entityKey
    ? { key: endpoint.entityKey, kind: "npcs" as const, name: "Skywarden", slug: "skywarden", variant: `stop-${endpoint.entityKey.split(":")[1]}` }
    : { key: null, label: endpoint.label ?? "Unknown" };
  const networks = flightNetworks(facts, resolve);
  expect(networks).toHaveLength(2);
  expect(networks.map((entry) => entry.scene)).toEqual(["Overworld", "Test Area"]);
  expect(networks[0]!.stops[0]!.master).toMatchObject({ key: "npcs:1", variant: "stop-1" });
  expect(networks[1]!.stops[0]!.master).toMatchObject({ key: "npcs:4" });
  expect(npcFlights(facts, new Set(["npcs:1"]), networks)[0]!.destinations.map((row) => [row.destination.id, row.direct, row.fare])).toEqual([
    ["second", true, 2], ["third", false, undefined],
  ]);
  expect(npcFlights(facts, new Set(["npcs:2"]), networks)[0]!.destinations.map((row) => row.destination.id)).toEqual(["third"]);
  expect(npcFlights(facts, new Set(["npcs:3"]), networks)[0]!.destinations.map((row) => [row.destination.id, row.fare])).toEqual([["second", 3]]);
  const zeroFareFacts = { ...facts, npcs: facts.npcs.map((npc) => ({ ...npc, flightNetwork: npc.flightNetwork && { ...npc.flightNetwork, routes: npc.flightNetwork.routes.map((route) => ({ ...route, fare: 0 })) } })) };
  expect(npcFlights(zeroFareFacts, new Set(["npcs:1"]), flightNetworks(zeroFareFacts, resolve))[0]!.destinations.map((row) => row.fare)).toEqual([0, 0]);
});
