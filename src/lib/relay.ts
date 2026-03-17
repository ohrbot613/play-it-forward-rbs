/**
 * Relay Route Matching
 * Finds volunteer courier chains so no one walks more than MAX_LEG_KM.
 * Pure algorithm — no DB, no API. Swap mock volunteers for real DB query later.
 */

import { distanceKm } from "./data";

export const MAX_LEG_KM = 2.5; // max distance any single volunteer carries

export interface VolunteerCourier {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Radius (km) the volunteer is willing to travel */
  rangeKm?: number;
}

export interface RelayLeg {
  from: { lat: number; lng: number; label: string };
  to: { lat: number; lng: number; label: string };
  volunteerId?: string;
  volunteerName?: string;
  distanceKm: number;
}

export interface RelayRoute {
  type: "direct" | "single-relay" | "double-relay";
  totalDistanceKm: number;
  legs: RelayLeg[];
  /** Lower = better match */
  score: number;
}

/**
 * Find the best relay route from holder → requester using available volunteers.
 *
 * Returns null if no route found within MAX_LEG_KM constraints.
 * Routes are sorted by score (total distance × number of legs).
 */
export function findRelayRoutes(
  holder: { lat: number; lng: number },
  requester: { lat: number; lng: number },
  volunteers: VolunteerCourier[],
  maxLegKm: number = MAX_LEG_KM
): RelayRoute[] {
  const routes: RelayRoute[] = [];

  const directDist = distanceKm(holder.lat, holder.lng, requester.lat, requester.lng);

  // Direct (no relay needed)
  if (directDist <= maxLegKm) {
    routes.push({
      type: "direct",
      totalDistanceKm: directDist,
      legs: [
        {
          from: { ...holder, label: "Game holder" },
          to: { ...requester, label: "Requester" },
          distanceKm: directDist,
        },
      ],
      score: directDist,
    });
  }

  // Single-relay: holder → volunteer → requester
  for (const v of volunteers) {
    const range = v.rangeKm ?? maxLegKm;
    const leg1 = distanceKm(holder.lat, holder.lng, v.lat, v.lng);
    const leg2 = distanceKm(v.lat, v.lng, requester.lat, requester.lng);
    if (leg1 <= Math.min(maxLegKm, range) && leg2 <= Math.min(maxLegKm, range)) {
      routes.push({
        type: "single-relay",
        totalDistanceKm: leg1 + leg2,
        legs: [
          {
            from: { ...holder, label: "Game holder" },
            to: { lat: v.lat, lng: v.lng, label: v.name },
            volunteerId: v.id,
            volunteerName: v.name,
            distanceKm: leg1,
          },
          {
            from: { lat: v.lat, lng: v.lng, label: v.name },
            to: { ...requester, label: "Requester" },
            volunteerId: v.id,
            volunteerName: v.name,
            distanceKm: leg2,
          },
        ],
        score: (leg1 + leg2) * 1.3, // slight penalty for 2 legs vs 1
      });
    }
  }

  // Double-relay: holder → v1 → v2 → requester
  for (let i = 0; i < volunteers.length; i++) {
    for (let j = 0; j < volunteers.length; j++) {
      if (i === j) continue;
      const v1 = volunteers[i];
      const v2 = volunteers[j];
      const r1 = v1.rangeKm ?? maxLegKm;
      const r2 = v2.rangeKm ?? maxLegKm;
      const leg1 = distanceKm(holder.lat, holder.lng, v1.lat, v1.lng);
      const leg2 = distanceKm(v1.lat, v1.lng, v2.lat, v2.lng);
      const leg3 = distanceKm(v2.lat, v2.lng, requester.lat, requester.lng);
      if (
        leg1 <= Math.min(maxLegKm, r1) &&
        leg2 <= Math.min(maxLegKm, r1, r2) &&
        leg3 <= Math.min(maxLegKm, r2)
      ) {
        routes.push({
          type: "double-relay",
          totalDistanceKm: leg1 + leg2 + leg3,
          legs: [
            {
              from: { ...holder, label: "Game holder" },
              to: { lat: v1.lat, lng: v1.lng, label: v1.name },
              volunteerId: v1.id,
              volunteerName: v1.name,
              distanceKm: leg1,
            },
            {
              from: { lat: v1.lat, lng: v1.lng, label: v1.name },
              to: { lat: v2.lat, lng: v2.lng, label: v2.name },
              volunteerId: v2.id,
              volunteerName: v2.name,
              distanceKm: leg2,
            },
            {
              from: { lat: v2.lat, lng: v2.lng, label: v2.name },
              to: { ...requester, label: "Requester" },
              volunteerId: v2.id,
              volunteerName: v2.name,
              distanceKm: leg3,
            },
          ],
          score: (leg1 + leg2 + leg3) * 1.7, // larger penalty for 3 legs
        });
      }
    }
  }

  return routes.sort((a, b) => a.score - b.score);
}

/** Returns the single best route, or null if none found */
export function bestRelayRoute(
  holder: { lat: number; lng: number },
  requester: { lat: number; lng: number },
  volunteers: VolunteerCourier[],
  maxLegKm?: number
): RelayRoute | null {
  const routes = findRelayRoutes(holder, requester, volunteers, maxLegKm);
  return routes.length > 0 ? routes[0] : null;
}
