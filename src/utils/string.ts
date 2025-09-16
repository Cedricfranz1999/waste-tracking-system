import crypto from "crypto";

// Helper: generate a random marker
const generateMarker = (): string => {
  return `$2a$${crypto.randomBytes(8).toString("hex")}$`;
};

// Structure for encoded field
type EncodedData = {
  $: string;
  value: string;
  $$: string;
};

// Encode string with unique start/end markers
const encodeToBase64WithMarkers = (str: string): EncodedData => {
  const marker = generateMarker();
  const base64 = Buffer.from(str, "utf8").toString("base64");
  return {
    $: marker,
    value: base64,
    $$: marker,
  };
};

const decodeFromBase64WithMarkers = (encoded: EncodedData): string => {
  if (encoded.$ !== encoded.$$) {
    throw new Error(
      "Marker validation failed: start and end markers do not match",
    );
  }

  return Buffer.from(encoded.value, "base64").toString("utf8");
};

const safeDecode = (field: string | null): string | null => {
  if (!field) return null;

  try {
    const parsed: EncodedData = JSON.parse(field);

    // Additional validation: check if the structure is correct
    if (!parsed.$ || !parsed.value || !parsed.$$) {
      return "Edited Data";
    }

    // This will throw an error if markers don't match
    return decodeFromBase64WithMarkers(parsed);
  } catch (error) {
    if (error instanceof Error) {
      return `Edited Data`;
    }
    return "Edited Data";
  }
};

export {
  generateMarker,
  encodeToBase64WithMarkers,
  decodeFromBase64WithMarkers,
  safeDecode
}