import { CacheDriver } from './driverStateCache';
import { PendingOrder } from './dispatch.repository';
import { env } from '../../config/env';

// Fallback city-center coordinates when a store has none (Safi by default,
// configurable per deployment via env).
const FALLBACK_LAT = env.DEFAULT_MAP_LATITUDE ?? 32.2994;
const FALLBACK_LNG = env.DEFAULT_MAP_LONGITUDE ?? -9.2372;

export interface MatchDecision {
  orderId: string;
  driverId: string;
  distance: number;
  acceptanceRate: number;
  reliabilityScore: number;
  activeLoad: number;
}

export class AssignmentEngine {
  /**
   * Run the matching algorithm between unassigned pending orders and online available drivers.
   */
  match(
    pendingOrders: PendingOrder[],
    availableDrivers: CacheDriver[],
    activeLoads: Record<string, number>,
    zonesList: any[] = []
  ): MatchDecision[] {
    const assignments: MatchDecision[] = [];

    // Zone adjacency comes from delivery_zones.neighbor_zone_ids (migration
    // 056), so expanding to a new city or reshaping zones is a data change.
    const neighborMap: Record<string, Set<string>> = {};
    zonesList.forEach(z => {
      if (z && z.id) {
        neighborMap[z.id] = new Set(
          (Array.isArray(z.neighbor_zone_ids) ? z.neighbor_zone_ids : []).map(String)
        );
      }
    });
    const manualZoneIds = new Set(
      zonesList
        .filter(z => z?.id && z.dispatch_mode === 'MANUAL_DISPATCH')
        .map(z => z.id)
    );

    function areZonesNeighbors(zoneId1: string | null | undefined, zoneId2: string | null | undefined): boolean {
      if (!zoneId1 || !zoneId2) return false;
      // Treat adjacency as symmetric even if only one direction is stored.
      return neighborMap[zoneId1]?.has(String(zoneId2)) === true
        || neighborMap[zoneId2]?.has(String(zoneId1)) === true;
    }

    // Clone loads map to track driver loads dynamically as we assign orders in this cycle
    const currentLoads = { ...activeLoads };
    // Track assigned driver IDs to ensure we don't double assign in a single matching tick
    const assignedDriverIds = new Set<string>();

    for (const order of pendingOrders) {
      const rejectedIds: string[] = order.rejected_driver_ids || [];

      // Get store coordinates and zone_id
      const storeObj = Array.isArray(order.stores) ? order.stores[0] : (order.stores as any);
      const storeLat = storeObj?.lat ? Number(storeObj.lat) : FALLBACK_LAT;
      const storeLng = storeObj?.lng ? Number(storeObj.lng) : FALLBACK_LNG;
      const storeZoneId = storeObj?.zone_id || null;
      const storeDispatchMode = storeObj?.dispatch_mode || 'AUTO_DISPATCH';

      if (order.dispatch_mode === 'MANUAL_DISPATCH') {
        continue;
      }
      if (storeDispatchMode === 'MANUAL_DISPATCH' || (storeZoneId && manualZoneIds.has(storeZoneId))) {
        continue;
      }

      // Filter drivers eligible for this order
      const candidates = availableDrivers
        .filter(driver => {
          // 1. Skip if driver was already assigned in this cycle
          if (assignedDriverIds.has(driver.id)) {
            return false;
          }
          // 2. Skip if driver rejected this order previously
          if (rejectedIds.includes(driver.id)) {
            return false;
          }
          return true;
        })
        .map(driver => {
          const load = currentLoads[driver.id] || 0;
          const hasDriverCoords = driver.current_lat !== null && driver.current_lng !== null;
          const hasStoreCoords = storeObj?.lat !== null && storeObj?.lng !== null;
          const dist = hasDriverCoords && hasStoreCoords
            ? this.calculateDistance(
                storeLat,
                storeLng,
                Number(driver.current_lat),
                Number(driver.current_lng)
              )
            : 0;

          // Calculate Zone Tier
          let zoneTier = 3; // Fallback Zone
          if (storeZoneId && driver.zone_id) {
            if (storeZoneId === driver.zone_id) {
              zoneTier = 1; // Same Zone
            } else if (areZonesNeighbors(storeZoneId, driver.zone_id)) {
              zoneTier = 2; // Neighboring Zone
            }
          }

          // GPS distance is optional. When available, use it only as a safety/tie-break signal.
          if (hasDriverCoords && hasStoreCoords && dist > 20) {
            return null;
          }
          if (hasDriverCoords && hasStoreCoords && dist > 10 && zoneTier < 3) {
            zoneTier = 3;
          }

          return {
            driver,
            activeLoad: load,
            distance: dist,
            zoneTier,
            jobsCompleted: Number(driver.jobs_completed || 0),
            totalOffers: Number(driver.total_offers || 0),
            warningCount: Number(driver.warning_count || 0),
            consecutiveTimeouts: Number(driver.consecutive_timeouts || 0),
            acceptanceRate: Number(driver.driver_acceptance_rate || 0),
            reliabilityScore: Number(driver.driver_reliability_score ?? 100)
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
        // Enforce max 1 active delivery rule (load must be 0)
        .filter(candidate => candidate.activeLoad === 0);

      if (candidates.length === 0) {
        continue;
      }

      // Priority Gating and Sorting:
      // 1. Zone Tier (ascending: Same Zone = 1 > Neighbor Zone = 2 > Fallback = 3)
      // 2. Overload: activeLoad (ascending)
      // 3. Penalties: warningCount (ascending) -> consecutiveTimeouts (ascending)
      // 4. Reliability and acceptance (descending)
      // 5. Workload / Fair Rotation: jobsCompleted (ascending) -> totalOffers (ascending)
      // 6. GPS Distance (ascending) as a secondary tie-breaker.
      candidates.sort((a, b) => {
        if (a.zoneTier !== b.zoneTier) {
          return a.zoneTier - b.zoneTier;
        }
        if (a.activeLoad !== b.activeLoad) {
          return a.activeLoad - b.activeLoad;
        }
        if (a.warningCount !== b.warningCount) {
          return a.warningCount - b.warningCount;
        }
        if (a.consecutiveTimeouts !== b.consecutiveTimeouts) {
          return a.consecutiveTimeouts - b.consecutiveTimeouts;
        }
        if (a.reliabilityScore !== b.reliabilityScore) {
          return b.reliabilityScore - a.reliabilityScore;
        }
        if (a.acceptanceRate !== b.acceptanceRate) {
          return b.acceptanceRate - a.acceptanceRate;
        }
        if (a.jobsCompleted !== b.jobsCompleted) {
          return a.jobsCompleted - b.jobsCompleted;
        }
        if (a.totalOffers !== b.totalOffers) {
          return a.totalOffers - b.totalOffers;
        }
        return a.distance - b.distance;
      });

      const bestChoice = candidates[0];
      const bestDriver = bestChoice.driver;

      assignments.push({
        orderId: order.id,
        driverId: bestDriver.id,
        distance: bestChoice.distance,
        acceptanceRate: bestChoice.acceptanceRate,
        reliabilityScore: bestChoice.reliabilityScore,
        activeLoad: bestChoice.activeLoad
      });

      // Update state for subsequent orders in this cycle
      assignedDriverIds.add(bestDriver.id);
      currentLoads[bestDriver.id] = (currentLoads[bestDriver.id] || 0) + 1;
    }

    return assignments;
  }

  /**
   * Haversine formula distance calculation in km
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
