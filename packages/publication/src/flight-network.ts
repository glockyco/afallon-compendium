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
    const outgoing = new Map<string, Array<{ to: string; fare: number; currency: FlightNetwork["routes"][number]["currency"] }>>();
    for (const route of network.routes) {
      const forward = outgoing.get(route.from) ?? [];
      forward.push({ to: route.to, fare: route.fare, currency: route.currency });
      outgoing.set(route.from, forward);
      if (route.bidirectional) {
        const reverse = outgoing.get(route.to) ?? [];
        reverse.push({ to: route.from, fare: route.fare, currency: route.currency });
        outgoing.set(route.to, reverse);
      }
    }
    const visited = new Set([stop.id]), queue = [stop.id];
    for (let index = 0; index < queue.length; index++) {
      for (const edge of outgoing.get(queue[index]!) ?? []) {
        if (visited.has(edge.to)) continue;
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
    const direct = new Map((outgoing.get(stop.id) ?? []).map((edge) => [edge.to, edge]));
    const allFaresZero = queue.every((origin) => (outgoing.get(origin) ?? []).every((edge) => edge.fare === 0));
    result.push({ stop, destinations: network.stops.filter((destination) => destination.id !== stop.id && visited.has(destination.id))
      .map((destination) => {
        const edge = direct.get(destination.id);
        const currency = edge?.currency ?? (allFaresZero ? network.routes[0]?.currency : undefined);
        return { destination, direct: edge !== undefined,
          ...(edge || allFaresZero ? { fare: edge?.fare ?? 0 } : {}),
          ...(currency ? { currency } : {}) };
      }).sort((a, b) => a.destination.name.localeCompare(b.destination.name)) });
  }
  return result;
}
