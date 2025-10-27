// ~/utils/geolocation.ts

// Enhanced cache with TTL and batch processing support
const geocodingCache = new Map<string, { location: string; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const FAILURE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for failures

// Batch processing queue
const processingQueue: Array<{
  lat: string;
  lon: string;
  resolve: (value: string) => void;
  reject: (reason: any) => void;
}> = [];
let processing = false;

const createCacheKey = (lat: string, lon: string): string =>
  `${parseFloat(lat).toFixed(6)},${parseFloat(lon).toFixed(6)}`;

const processBatch = async () => {
  if (processing || processingQueue.length === 0) return;

  processing = true;
  const batch = processingQueue.splice(0, 5); // Process 5 at a time

  try {
    const batchPromises = batch.map(async ({ lat, lon, resolve, reject }) => {
      const cacheKey = createCacheKey(lat, lon);
      const cached = geocodingCache.get(cacheKey);

      // Check cache validity
      if (cached) {
        const isExpired = cached.timestamp < Date.now() -
          (cached.location === "Unknown Location" ? FAILURE_CACHE_TTL : CACHE_TTL);

        if (!isExpired) {
          resolve(cached.location);
          return;
        }

        geocodingCache.delete(cacheKey);
      }

      try {
        const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);

        if (!response.ok) {
          throw new Error(`Geocoding API responded with status: ${response.status}`);
        }

        const data = await response.json();
        const displayName = data.display_name || "Unknown Location";

        // Cache successful result
        geocodingCache.set(cacheKey, {
          location: displayName,
          timestamp: Date.now()
        });

        resolve(displayName);
      } catch (error) {
        // Cache failure
        geocodingCache.set(cacheKey, {
          location: "Unknown Location",
          timestamp: Date.now()
        });
        reject(error);
      }
    });

    await Promise.allSettled(batchPromises);
  } finally {
    processing = false;

    // Process next batch if any
    if (processingQueue.length > 0) {
      setTimeout(processBatch, 100); // Small delay between batches
    }
  }
};

export async function reverseGeocode(lat: string, lon: string): Promise<string> {
  const cacheKey = createCacheKey(lat, lon);
  const cached = geocodingCache.get(cacheKey);

  // Return cached result if valid
  if (cached) {
    const isExpired = cached.timestamp < Date.now() -
      (cached.location === "View in Map" ? FAILURE_CACHE_TTL : CACHE_TTL);

    if (!isExpired) {
      return cached.location;
    }

    geocodingCache.delete(cacheKey);
  }

  // Add to processing queue
  return new Promise((resolve, reject) => {
    processingQueue.push({ lat, lon, resolve, reject });

    if (!processing) {
      setTimeout(processBatch, 0);
    }
  });
}

// Utility function to clear cache if needed
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}

// Get cache stats for debugging
export function getGeocodingCacheStats() {
  return {
    size: geocodingCache.size,
    keys: Array.from(geocodingCache.keys())
  };
}
