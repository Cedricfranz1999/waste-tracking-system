// ✅ Pre-process barangays into Set for O(1) lookup
const CALBAYOG_BARANGAYS_SET = new Set([
  "aguit-itan", "alibaba", "amampacang", "anislag", "awang",
  "bacdo", "bagacay", "bagong lipunan", "baja", "bakante",
  "balud", "banase", "bancasan", "bantian", "barral",
  "basud", "bayo", "belen", "bentuco", "benyamen",
  "binaliw", "bontay", "buenavista", "cabacungan", "cabatuan",
  "cabicahan", "cabolaloan", "cabol-an", "cabugawan", "cagbanay",
  "cagbayang", "cagmanipes", "cagsalaosao", "calampisan", "calintaan",
  "calocnayan", "camanci", "camayse", "canlapwas", "capoocan",
  "carayman", "carmen", "casoy", "caybago", "centro",
  "cogon", "colambutan", "dagum", "daligan", "danao",
  "dawo", "de victoria", "dilig", "dinagan", "dio",
  "east awang", "erenas", "gabay", "gadgaran", "gasdo",
  "geraga-an", "guimbaoyan norte", "guimbaoyan sur", "guin-on", "hamorawon",
  "helino", "hernani", "hibabngan", "himalandrog", "hobo",
  "holio", "igang", "igot", "inoburan", "jaguimitan",
  "japonan", "jose a. roño", "kilotongan", "la paz", "langoyon",
  "lapaan", "libertad", "libas", "limon", "looc",
  "longsob", "lonoy", "loreto", "lucoy", "mabini i",
  "mabini ii", "macatingog", "maganhan", "magbay", "mag-uray",
  "malaga", "malajog", "malopalo", "mantaong", "manraya",
  "marcatubig", "mason", "maybog", "maysalong", "migara",
  "milagros", "minahab", "nakar", "naga", "nalib",
  "napo", "natalay", "nicolas", "oboob", "obrero",
  "olera", "osmeña", "pagbalican", "palanas", "palhan",
  "pangpang", "panlayahan", "panonongan", "panoypoy", "patong",
  "peña", "pilar", "pinit", "raga", "roxas i",
  "roxas ii", "sabang", "saljag", "san antonio", "san isidro",
  "san jose", "san policarpo", "san rufino", "sansanan", "santo niño",
  "saputan", "sigo", "sinidman", "socorro", "sogod",
  "sua", "sulangan", "tabawan", "talisay", "tamoso",
  "tapat", "tarabucan", "tigbe", "tilib", "tinambacan norte",
  "tinambacan sur", "tomaliguez", "ubong", "ubo", "villahermosa",
  "weste", "zumarraga"
]);

// ✅ Case mapping for proper capitalization
const BARANGAY_CASE_MAP: Record<string, string> = {
  "aguit-itan": "Aguit-itan",
  "alibaba": "Alibaba",
  "amampacang": "Amampacang",
  "anislag": "Anislag",
  "awang": "Awang",
  "bacdo": "Bacdo",
  "bagacay": "Bagacay",
  "bagong lipunan": "Bagong Lipunan",
  "baja": "Baja",
  "bakante": "Bakante",
  "balud": "Balud",
  "banase": "Banase",
  "bancasan": "Bancasan",
  "bantian": "Bantian",
  "barral": "Barral",
  "basud": "Basud",
  "bayo": "Bayo",
  "belen": "Belen",
  "bentuco": "Bentuco",
  "benyamen": "Benyamen",
  "binaliw": "Binaliw",
  "bontay": "Bontay",
  "buenavista": "Buenavista",
  "cabacungan": "Cabacungan",
  "cabatuan": "Cabatuan",
  "cabicahan": "Cabicahan",
  "cabolaloan": "Cabolaloan",
  "cabol-an": "Cabol-an",
  "cabugawan": "Cabugawan",
  "cagbanay": "Cagbanay",
  "cagbayang": "Cagbayang",
  "cagmanipes": "Cagmanipes",
  "cagsalaosao": "Cagsalaosao",
  "calampisan": "Calampisan",
  "calintaan": "Calintaan",
  "calocnayan": "Calocnayan",
  "camanci": "Camanci",
  "camayse": "Camayse",
  "canlapwas": "Canlapwas",
  "capoocan": "Capoocan",
  "carayman": "Carayman",
  "carmen": "Carmen",
  "casoy": "Casoy",
  "caybago": "Caybago",
  "centro": "Centro",
  "cogon": "Cogon",
  "colambutan": "Colambutan",
  "dagum": "Dagum",
  "daligan": "Daligan",
  "danao": "Danao",
  "dawo": "Dawo",
  "de victoria": "De Victoria",
  "dilig": "Dilig",
  "dinagan": "Dinagan",
  "dio": "Dio",
  "east awang": "East Awang",
  "erenas": "Erenas",
  "gabay": "Gabay",
  "gadgaran": "Gadgaran",
  "gasdo": "Gasdo",
  "geraga-an": "Geraga-an",
  "guimbaoyan norte": "Guimbaoyan Norte",
  "guimbaoyan sur": "Guimbaoyan Sur",
  "guin-on": "Guin-on",
  "hamorawon": "Hamorawon",
  "helino": "Helino",
  "hernani": "Hernani",
  "hibabngan": "Hibabngan",
  "himalandrog": "Himalandrog",
  "hobo": "Hobo",
  "holio": "Holio",
  "igang": "Igang",
  "igot": "Igot",
  "inoburan": "Inoburan",
  "jaguimitan": "Jaguimitan",
  "japonan": "Japonan",
  "jose a. roño": "Jose A. Roño",
  "kilotongan": "Kilotongan",
  "la paz": "La Paz",
  "langoyon": "Langoyon",
  "lapaan": "Lapaan",
  "libertad": "Libertad",
  "libas": "Libas",
  "limon": "Limon",
  "looc": "Looc",
  "longsob": "Longsob",
  "lonoy": "Lonoy",
  "loreto": "Loreto",
  "lucoy": "Lucoy",
  "mabini i": "Mabini I",
  "mabini ii": "Mabini II",
  "macatingog": "Macatingog",
  "maganhan": "Maganhan",
  "magbay": "Magbay",
  "mag-uray": "Mag-uray",
  "malaga": "Malaga",
  "malajog": "Malajog",
  "malopalo": "Malopalo",
  "mantaong": "Mantaong",
  "manraya": "Manraya",
  "marcatubig": "Marcatubig",
  "mason": "Mason",
  "maybog": "Maybog",
  "maysalong": "Maysalong",
  "migara": "Migara",
  "milagros": "Milagros",
  "minahab": "Minahab",
  "nakar": "Nakar",
  "naga": "Naga",
  "nalib": "Nalib",
  "napo": "Napo",
  "natalay": "Natalay",
  "nicolas": "Nicolas",
  "oboob": "Oboob",
  "obrero": "Obrero",
  "olera": "Olera",
  "osmeña": "Osmeña",
  "pagbalican": "Pagbalican",
  "palanas": "Palanas",
  "palhan": "Palhan",
  "pangpang": "Pangpang",
  "panlayahan": "Panlayahan",
  "panonongan": "Panonongan",
  "panoypoy": "Panoypoy",
  "patong": "Patong",
  "peña": "Peña",
  "pilar": "Pilar",
  "pinit": "Pinit",
  "raga": "Raga",
  "roxas i": "Roxas I",
  "roxas ii": "Roxas II",
  "sabang": "Sabang",
  "saljag": "Saljag",
  "san antonio": "San Antonio",
  "san isidro": "San Isidro",
  "san jose": "San Jose",
  "san policarpo": "San Policarpo",
  "san rufino": "San Rufino",
  "sansanan": "Sansanan",
  "santo niño": "Santo Niño",
  "saputan": "Saputan",
  "sigo": "Sigo",
  "sinidman": "Sinidman",
  "socorro": "Socorro",
  "sogod": "Sogod",
  "sua": "Sua",
  "sulangan": "Sulangan",
  "tabawan": "Tabawan",
  "talisay": "Talisay",
  "tamoso": "Tamoso",
  "tapat": "Tapat",
  "tarabucan": "Tarabucan",
  "tigbe": "Tigbe",
  "tilib": "Tilib",
  "tinambacan norte": "Tinambacan Norte",
  "tinambacan sur": "Tinambacan Sur",
  "tomaliguez": "Tomaliguez",
  "ubong": "Ubong",
  "ubo": "Ubo",
  "villahermosa": "Villahermosa",
  "weste": "Weste",
  "zumarraga": "Zumarraga"
};

export async function reverseGeocode(lat: string, lon: string): Promise<string> {
  try {
    const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
    const data = await response.json();

    const address = data.address || {};
    const fullAddress = (data.display_name || "").toLowerCase();

    // ✅ Quick Calbayog check
    const locationName = (address.city || address.town || address.municipality || "").toLowerCase();
    const isCalbayog = locationName.includes("calbayog");

    if (isCalbayog) {
      // ✅ Check specific fields first (O(1) lookup)
      const checkFields = [
        address.barangay,
        address.village, 
        address.suburb,
        address.neighbourhood,
        address.hamlet
      ];

      for (const field of checkFields) {
        if (field && CALBAYOG_BARANGAYS_SET.has(field.toLowerCase())) {
          return BARANGAY_CASE_MAP[field.toLowerCase()] || field;
        }
      }

      // ✅ Quick full address scan
      const words = fullAddress.split(/[\s,]+/);
      for (const word of words) {
        const cleanWord = word.replace(/[^a-zA-Z-]/g, '').toLowerCase();
        if (CALBAYOG_BARANGAYS_SET.has(cleanWord)) {
          return BARANGAY_CASE_MAP[cleanWord] || cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
        }
      }
    }

    // ✅ Return full address if not Calbayog or no match
    return data.display_name || "View Map";
    
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return "Unknown Location";
  }
}