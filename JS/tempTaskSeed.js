import {auth, db} from './modules/dbConfig.js';
export async function generateFictiveTasks() {

  // ── Helpers for fetching real data from Firebase ──────────────────────────
async function getUsersV2() {
  const snapshot = await db.collection("users").get();
  if (snapshot.empty) throw new Error("Ingen brukere funnet i 'users'-samlingen.");
  return snapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id:          doc.id,
      email:       d.email ?? "",
      displayName: d.name?.display ?? "",
    };
  });
}
  async function getImageURLs() {
    try {
      // List everything directly under the root of the default Storage bucket.
      // Adjust the prefix/path if your images live in a sub-folder, e.g.:
      //   storage.ref("task-images")
      const listResult = await firebase.storage().ref().listAll();
      const urls = await Promise.all(
        listResult.items.map(itemRef => itemRef.getDownloadURL())
      );
      return urls.length > 0 ? urls : null;
    } catch (err) {
      console.warn("Kunne ikke hente bilder fra Storage:", err.message);
      return null;
    }
  }

  // ── Static seed data ──────────────────────────────────────────────────────

  const titles = [
    "Fix broken fence", "Paint house exterior", "Repair roof leak",
    "Clean gutters", "Landscape garden", "Fix plumbing issue",
    "Replace windows", "Repair deck", "Paint interior walls",
    "Install new door", "Fix electrical outlet", "Repair driveway",
    "Clean chimney", "Seal foundation cracks", "Replace siding"
  ];

  const descriptions = [
    "Urgent maintenance needed",
    "Regular maintenance task",
    "Customer reported issue",
    "Preventive maintenance",
    "Emergency repair needed",
    "Scheduled maintenance",
    "Follow-up from previous visit"
  ];

  const tags = [
    "urgent", "maintenance", "repair", "electrical", "plumbing",
    "carpentry", "painting", "landscaping", "roofing", "inspection"
  ];

  const categories = [
    "Hage", "IT & Teknikk", "Rengjøring", "Flytting", "Montering",
    "Transport", "Undervisning", "Maling", "Rydding", "Annet"
  ];

  // Fallback image used only when Storage returns nothing
  const FALLBACK_IMAGE = "https://firebasestorage.googleapis.com/v0/b/app200v-team11.firebasestorage.app/o/deer54x54.png?alt=media&token=60f2af4e-ca14-4b97-a218-12e424919be0";

  // ── Fetch real users + images in parallel ─────────────────────────────────

  const [realUsers, fetchedImages] = await Promise.all([
    getUsersV2(),
    getImageURLs(),
  ]);
console.log(realUsers[0]);
  const imageURLs = fetchedImages ?? [FALLBACK_IMAGE];

  // ── Zone / location tables ────────────────────────────────────────────────

  /*
    Referansepunkt: 59.27, 10.42 (Tønsberg)
    Oppdrag genereres innenfor 5 / 10 / 20 / 200 km fra dette punktet
    slik at avstandsfiltrering kan testes ordentlig.
  */
  const communesByZone = {
    5: [
      { name: "Tønsberg sentrum", latitude: 59.2723, longitude: 10.4179 },
      { name: "Sem",              latitude: 59.2950, longitude: 10.3800 },
      { name: "Teie (Nøtterøy)", latitude: 59.2450, longitude: 10.4050 },
      { name: "Vallø",            latitude: 59.2500, longitude: 10.4700 },
      { name: "Borgheim",         latitude: 59.2300, longitude: 10.3900 },
      { name: "Eik",              latitude: 59.2850, longitude: 10.4500 },
      { name: "Byskogen",         latitude: 59.2600, longitude: 10.4300 },
    ],
    10: [
      { name: "Stokke",           latitude: 59.2200, longitude: 10.2950 },
      { name: "Skoppum",          latitude: 59.3300, longitude: 10.3500 },
      { name: "Åsgårdstrand",     latitude: 59.3450, longitude: 10.4650 },
      { name: "Nøtterøy sør",    latitude: 59.1950, longitude: 10.4200 },
      { name: "Re (Revetal)",     latitude: 59.2900, longitude: 10.2700 },
      { name: "Borre",            latitude: 59.3700, longitude: 10.4500 },
      { name: "Smørbukk",        latitude: 59.2400, longitude: 10.5100 },
    ],
    20: [
      { name: "Sandefjord",       latitude: 59.1310, longitude: 10.2167 },
      { name: "Horten",           latitude: 59.4144, longitude: 10.4817 },
      { name: "Holmestrand",      latitude: 59.4900, longitude: 10.3200 },
      { name: "Tjøme",            latitude: 59.1200, longitude: 10.4100 },
      { name: "Andebu",           latitude: 59.2000, longitude: 10.1600 },
      { name: "Stokke (ytre)",   latitude: 59.1700, longitude: 10.2900 },
      { name: "Sande",            latitude: 59.5900, longitude: 10.2200 },
      { name: "Hvasser",          latitude: 59.1050, longitude: 10.4600 },
      { name: "Ramnes",           latitude: 59.3300, longitude: 10.1900 },
    ],
    200: [
      { name: "Oslo",             latitude: 59.9139, longitude: 10.7522 },
      { name: "Drammen",          latitude: 59.7440, longitude: 10.2045 },
      { name: "Skien",            latitude: 59.2090, longitude:  9.6100 },
      { name: "Bergen",           latitude: 60.3913, longitude:  5.3221 },
      { name: "Trondheim",        latitude: 63.4305, longitude: 10.3951 },
      { name: "Stavanger",        latitude: 58.9700, longitude:  5.7331 },
      { name: "Kristiansand",     latitude: 58.1467, longitude:  7.9956 },
      { name: "Tromsø",           latitude: 69.6489, longitude: 18.9551 },
    ],
  };

  // ── Pure helper functions ─────────────────────────────────────────────────

  function random3km(baseLat, baseLon) {
    const radiusKm = 3;
    // Uniform distribution across area (not clustered in centre)
    const r     = radiusKm * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    const latOffset = (r / 111.32) * Math.cos(theta);
    const lonOffset = (r / (111.32 * Math.cos(baseLat * Math.PI / 180))) * Math.sin(theta);

    return { latitude: baseLat + latOffset, longitude: baseLon + lonOffset };
  }

  function getLocationWithCoords(zone) {
    const zones = [5, 10, 20, 200];
    if (zone === undefined) zone = zones[Math.floor(Math.random() * zones.length)];
    const pool   = communesByZone[zone];
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const coords = random3km(chosen.latitude, chosen.longitude);
    return {
      kommune:   chosen.name,
      latitude:  coords.latitude,
      longitude: coords.longitude,
    };
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function getRandomTags() {
    const numTags = Math.floor(Math.random() * 3) + 1;
    const selected = [];
    for (let i = 0; i < numTags; i++) selected.push(pick(tags));
    return [...new Set(selected)];
  }

  function buildPayload(location) {
    const user = pick(realUsers);
    return {
      title:       pick(titles),
      description: pick(descriptions),
      status:      "open",
      pris:        Math.floor(Math.random() * 99) * 100 + 100,
      category:    pick(categories),
      urgent:      Math.random() < 0.2,
      meta: {
        created: firebase.firestore.FieldValue.serverTimestamp(),
        tags:    getRandomTags(),
      },
      createdBy: {
        uid:         user.id,
        ePost:       user.email,
        displayName: user.displayName,
      },
      assignee: { uid: "", ePost: "" },
      location,
      images:  [pick(imageURLs)],
      rating:  Math.floor(Math.random() * 6) + 1,
    };
  }

  // ── Build task list ───────────────────────────────────────────────────────

  const tasks = [];

  // Minst ett oppdrag per sone slik at avstandsfilter kan testes
  for (const zone of [5, 10, 20, 200]) {
    tasks.push(buildPayload(getLocationWithCoords(zone)));
  }

  // Fyll opp til 50 totalt
  for (let i = 0; i < 46; i++) {
    tasks.push(buildPayload(getLocationWithCoords()));
  }
console.log("displayName type:", typeof realUsers[0].displayName, realUsers[0].displayName);
  return tasks;
}