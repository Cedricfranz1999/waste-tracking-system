const START_MARKER =
  "$:$2a$12$3KIB5e6BGLf2IZEoWYxtPeTDUN6rgQrHj3gV9qSINNgJdaXXLDaai";
const END_MARKER =
  "$$:$2a$12$ORLOi9cxLH/qPAT4FE2MLuBjIz7Nb7H1hTd1QcynsjIyP5j7Z1KHi";

type EncodedData = {
  $: string;
  value: string;
  $$: string;
};

const encodeToBase64WithMarkers = (str: string): EncodedData => {
  const base64 = Buffer.from(str, "utf8").toString("base64");
  return {
    $: START_MARKER,
    value: base64,
    $$: END_MARKER,
  };
};

const decodeFromBase64WithMarkers = (encoded: EncodedData): string => {
  if (encoded.$ !== START_MARKER || encoded.$$ !== END_MARKER) {
    throw new Error("Marker validation failed: markers do not match");
  }
  return Buffer.from(encoded.value, "base64").toString("utf8");
};

const safeDecode = (field: string | null): string | null => {
  if (!field) return null;
  try {
    const parsed: EncodedData = JSON.parse(field);
    if (
      !parsed.$ ||
      !parsed.value ||
      !parsed.$$ ||
      parsed.$ !== START_MARKER ||
      parsed.$$ !== END_MARKER
    ) {
      return "Edited Data";
    }
    return decodeFromBase64WithMarkers(parsed);
  } catch (error) {
    return "Edited Data";
  }
};

export { encodeToBase64WithMarkers, decodeFromBase64WithMarkers, safeDecode };
