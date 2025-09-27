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

const decodeMethod1 = (encoded: EncodedData): string => {
  if (encoded.$ !== START_MARKER || encoded.$$ !== END_MARKER) {
    throw new Error("Marker validation failed: markers do not match");
  }
  return Buffer.from(encoded.value, "base64").toString("utf8");
};

// const safeDecode = (field: string | null, method?: any): string | any => {
//   if (!field) return null;
//   try {
//     const parsed: EncodedData = JSON.parse(field);
//     if (
//       !parsed.$ ||
//       !parsed.value ||
//       !parsed.$$ ||
//       parsed.$ !== START_MARKER ||
//       parsed.$$ !== END_MARKER
//     ) {
//       return "Edited Data";
//     }
//     return decodeMethod1(parsed);
//   } catch (error) {
//     return "Edited Data";
//   }
// };

const decodeMethod2 = (encoded: EncodedData, method: number = 1): string => {
  if (encoded.$ !== encoded.$$) {
    throw new Error(
      "Marker validation failed: start and end markers do not match",
    );
  }

  return Buffer.from(encoded.value, "base64").toString("utf8");
};

const safeDecode = (field: string | null, method: number = 2): string | null => {
  if (!field) return null;

  if (method == 2) {
    try {
      const parsed: EncodedData = JSON.parse(field);
  
      // Additional validation: check if the structure is correct
      if (!parsed.$ || !parsed.value || !parsed.$$) {
        return "Edited Data";
      }
  
      // This will throw an error if markers don't match
      return decodeMethod2(parsed);
    } catch (error) {
      if (error instanceof Error) {
        return `Edited Data`;
      }
      return "Edited Data";
    }
  }else {
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
      return decodeMethod1(parsed);
    } catch (error) {
      return "Edited Data";
    }
  }
};

export { encodeToBase64WithMarkers, safeDecode };
