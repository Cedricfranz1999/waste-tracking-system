import crypto from "crypto";

// Structure for encoded field
export type EncodedData = {
  $: string;
  value: string;
  $$: string;
};

// Generate a random marker
export const not_hard_coded_generateMarker = (): string => {
  return `$2a$${crypto.randomBytes(8).toString("hex")}$`;
};

// Encode string with unique start/end markers
export const encodeToBase64WithMarkers = (str: string): EncodedData => {
  const marker = not_hard_coded_generateMarker();
  const base64 = Buffer.from(str, "utf8").toString("base64");
  return {
    $: marker,
    value: base64,
    $$: marker,
  };
};

// Decode with marker validation
export const not_hard_coded_decodeFromBase64WithMarkers = (
  encoded: EncodedData,
): string => {
  if (encoded.$ !== encoded.$$) {
    throw new Error(
      "Marker validation failed: start and end markers do not match",
    );
  }

  return Buffer.from(encoded.value, "base64").toString("utf8");
};

// Safe decode that returns null or "Edited Data" when invalid
export const not_hard_coded_safeDecode = (
  field: string | null,
): string | null => {
  if (!field) return null;

  try {
    const parsed: EncodedData = JSON.parse(field);

    // Structure validation
    if (!parsed.$ || !parsed.value || !parsed.$$) {
      return "Edited Data";
    }

    return not_hard_coded_decodeFromBase64WithMarkers(parsed);
  } catch {
    return "Edited Data";
  }
};

// Utility to encode all product fields at once
export const encodeProductFields = (data: {
  image?: string;
  name?: string;
  barcode: string;
  manufacturer: string;
  description?: string;
  type: "INTERNATIONAL" | "LOCAL";
}) => {
  return {
    image: data.image
      ? JSON.stringify(encodeToBase64WithMarkers(data.image))
      : null,
    name: data.name
      ? JSON.stringify(encodeToBase64WithMarkers(data.name))
      : null,
    barcode: JSON.stringify(encodeToBase64WithMarkers(data.barcode)),
    manufacturer: JSON.stringify(encodeToBase64WithMarkers(data.manufacturer)),
    description: data.description
      ? JSON.stringify(encodeToBase64WithMarkers(data.description))
      : null,
    type: data.type,
  };
};

// Utility to decode all product fields at once
export const not_hard_coded_decodeProductFields = <
  T extends {
    image: string | null;
    name: string | null;
    barcode: string;
    manufacturer: string;
    description: string | null;
  },
>(
  product: T,
) => {
  return {
    ...product,
    image: not_hard_coded_safeDecode(product.image),
    name: not_hard_coded_safeDecode(product.name),
    barcode: not_hard_coded_safeDecode(product.barcode),
    manufacturer: not_hard_coded_safeDecode(product.manufacturer),
    description: not_hard_coded_safeDecode(product.description),
  };
};
