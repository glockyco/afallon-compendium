import type { CatalogFacts } from "@afallon/contracts/catalog";
import type { FlightNetwork, FlightStop, NpcFlights } from "@afallon/contracts/public";
import type { ReferenceResolver } from "./documents/projection";
import { plainText } from "./text";

/** One network is repeated on every flight master record. Keep its authored routes once. */
export function flightNetworks(facts: CatalogFacts, resolve: ReferenceResolver): FlightNetwork[] {
  const masters = new Map<string, string>();
  for (const npc of facts.npcs) if (npc.flightNetwork?.stopId)
    masters.set(JSON.stringify([npc.flightNetwork.networkId, npc.flightNetwork.sceneName, npc.flightNetwork.stopId]), npc.entityKey);
  const networks = new Map<string, FlightNetwork>();
  for (const npc of facts.npcs) {
    const flight = npc.flightNetwork;
    if (!flight) continue;
    const key = JSON.stringify([flight.networkId, flight.sceneName]);
    if (!networks.has(key)) networks.set(key, {
      id: flight.networkId, scene: plainText(flight.sceneName),
      stops: flight.stops.map((stop): FlightStop => {
        const master = masters.get(JSON.stringify([flight.networkId, flight.sceneName, stop.id]));
        return { id: stop.id, name: plainText(stop.name), knownInitially: stop.knownInitially,
          ...(master ? { master: resolve({ entityKey: master, label: stop.name }) } : {}) };
      }),
      routes: flight.routes.map((route) => ({ from: route.from, to: route.to, bidirectional: route.bidirectional,
        fare: route.fare, ...(flight.currency ? { currency: resolve(flight.currency) } : {}) })),
    });
  }
  return [...networks.values()].sort((a, b) => a.id.localeCompare(b.id) || a.scene.localeCompare(b.scene));
}

export function npcFlights(facts: CatalogFacts, entityKeys: ReadonlySet<string>, networks: readonly FlightNetwork[]): NpcFlights[] {
  const result: NpcFlights[] = [];
  for (const npc of facts.npcs) {
    if (!entityKeys.has(npc.entityKey) || !npc.flightNetwork?.stopId) continue;
    const flight = npc.flightNetwork;
    const network = networks.find((entry) => entry.id === flight.networkId && entry.scene === plainText(flight.sceneName));
    const stop = network?.stops.find((entry) => entry.id === flight.stopId);
    if (!network || !stop) continue;
    result.push({ stop, routes: network.routes.flatMap((route) => {
      const destinationId = route.from === stop.id ? route.to : route.bidirectional && route.to === stop.id ? route.from : null;
      const destination = network.stops.find((entry) => entry.id === destinationId);
      return destination ? [{ destination, fare: route.fare, ...(route.currency ? { currency: route.currency } : {}) }] : [];
    }).sort((a, b) => a.destination.name.localeCompare(b.destination.name)) });
  }
  return result;
}
