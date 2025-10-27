// Cache for geocoding results to avoid duplicate API calls
const geocodingCache = new Map<string, string>();

// Create cache key from coordinates
const createCacheKey = (lat: string, lon: string): string => 
  `${parseFloat(lat).toFixed(6)},${parseFloat(lon).toFixed(6)}`;

export async function reverseGeocode(lat: string, lon: string): Promise<string> {
  const cacheKey = createCacheKey(lat, lon);
  
  // Check cache first
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
    
    if (!response.ok) {
      throw new Error(`Geocoding API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    const displayName = data.display_name || "Unknown Location";

    // Cache the result
    geocodingCache.set(cacheKey, displayName);
    
    // Set timeout to clear cache after 1 hour to prevent memory leaks
    setTimeout(() => {
      geocodingCache.delete(cacheKey);
    }, 60 * 60 * 1000);

    return displayName;
    
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    
    // Cache failures for 5 minutes to avoid repeated failures
    geocodingCache.set(cacheKey, "Unknown Location");
    setTimeout(() => {
      geocodingCache.delete(cacheKey);
    }, 5 * 60 * 1000);
    
    return "Unknown Location";
  }
}

// If you need the full response data, create a separate function
export async function reverseGeocodeFull(lat: string, lon: string): Promise<any> {
  try {
    const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
    
    if (!response.ok) {
      throw new Error(`Geocoding API responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return { display_name: "Unknown Location" };
  }
}

// Utility function to clear cache if needed
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}