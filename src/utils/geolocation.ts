export async function reverseGeocode(lat: string, lon: string): Promise<string> {
  try {
    const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    const address = data.address || {};

    // Strictly return barangay from the response
    return (
      address.barangay ||
      address.village ||      // secondary fallback if barangay missing
      address.suburb ||       // optional fallback
      "Unknown Barangay"
    );
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return "Unknown Barangay";
  }
}
