import {getValgteKommuner} from './kommunevelger.js';
import {auth, db} from './modules/dbConfig.js';
import {getTask,
        setTask,
        updateTask,
        deleteTask,
        clearField,
        readFSdb        
} from './modules/FS_Requests.js'; 


async function getTasks(kommuner) {
  const antKommuner = kommuner.length;
  if(antKommuner > 30){
    const chunks = [];
    for (let i = 0; i < antKommuner; i += 30)
      chunks.push(kommuner.slice(i, i + 30));

    const snaps = await Promise.all(
      chunks.map(chunk => db.collection('tasks').where('location.kommune', 'in', chunk).get())
    );

    return snaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })));

  }
 const snap = (kommuner.length === 0)
  ? await db.collection('tasks').get() 
  : await db.collection('tasks').where('location.kommune', 'in', kommuner).get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getOppdragKommune (){
  const snap = await db.collection('tasks').get();
  const countPerKommune = {};
  snap.docs.forEach(d => {
                            const k = d.data().location.kommune;
                            if (k) countPerKommune[k] = (countPerKommune[k] || 0) + 1;
                  });
return countPerKommune;
}
window.addEventListener("load", () => {
   document.querySelectorAll('.tabs').forEach(tab => {
        tab.hidden = tab.id !== "browse-task";
    });
    addListeners();
    document.getElementById("last-oppgaver").addEventListener('click', tempLoad);
    auth.onAuthStateChanged((user)=>{

                if (user) {
                    insertMap();
                    insertForm();
                    insertUser(user);
                    document.getElementById("createTask").classList.remove("hidden");
                }
                else {
                    // User is not signed in
                    console.log("No user is signed in");
                    console.info(user);
                }

    });

});

async function tempLoad (){
  const oversikt = await getOppdragKommune();
  console.log(JSON.stringify(oversikt));
  const kommuner = getValgteKommuner();
  console.info(kommuner);
  const myData = await getTasks(kommuner);
   
  const feed = document.getElementById("feed");
  const feedFragment = document.createDocumentFragment();

   myData.forEach((element)=>{

    //console.info(element.title); 
    const oppgaveDiv = document.createElement("div");
    oppgaveDiv.classList.add("oppgaveHeader");
    
    const oppgaveLabel = document.createElement("div");
    oppgaveLabel.textContent = element.title;
    
    const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chev.setAttribute('viewBox', '0 0 14 14');
    chev.setAttribute('fill', 'none');
    chev.setAttribute('stroke', 'currentColor');
    chev.setAttribute('stroke-width', '1.5');
    chev.classList.add('kommunePil');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 4,2 l 5,5 -5,5');
    chev.appendChild(path);

    oppgaveDiv.appendChild(oppgaveLabel);  
    oppgaveDiv.appendChild(chev); 
    oppgaveDiv.addEventListener('click', ()=>{ 
                                      const isOpen = oppgaveInfo.classList.contains('open');
                                      oppgaveInfo.classList.toggle('open', !isOpen);
                                      chev.classList.toggle('open', !isOpen);
                                  })
    
    const oppgaveInfo = document.createElement('div');
    oppgaveInfo.textContent = JSON.stringify(element,null,2);
    oppgaveInfo.classList.add('oppgaveInfo');
    feedFragment.append(oppgaveDiv);
    feedFragment.appendChild(oppgaveInfo);


   } );
    

  feed.innerHTML ="";
  feed.appendChild(feedFragment);

}
function addListeners(){
document.querySelectorAll('#tab-buttons button').forEach(btn => {
    btn.addEventListener('click', (e) => showTab(e.target));
});
}

function showTab(target) {
    const tabId = target.dataset.tab;

    document.querySelectorAll('.tabs').forEach(tab => {
        tab.hidden = tab.id !== tabId;
    });
}

function insertMap() {
    var MY_API_KEY = "AIzaSyB-CC4QtLrD-HD9_63IQFhNroyE8pnOOQY";
    const APILoader = document.createElement("script");
    APILoader.src = "https://maps.googleapis.com/maps/api/js?key=" + MY_API_KEY + "&callback=initMap";
    document.head.appendChild(APILoader);

}
function insertForm(){
    const parentElm = document.getElementById("map-input-sidebyside");
    const inputForm = document.getElementById("register-task");
    const newForm = createRegisterTaskForm();
    parentElm.replaceChild(newForm, inputForm);

}
function insertUser(user){
   
      // User is signed in
      console.log("User UID:", user.uid);
      const epostInput = document.getElementById("e-post");
      const brukerInput = document.getElementById("bruker");
            epostInput.value= user.email;
            brukerInput.value = user.uid;
    
}
  
window.initMap = function() {
    // Define Norway's bounding box
    const norwayBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(57.96, 4.75),    // Southwest corner
        new google.maps.LatLng(71.19, 31.29)    // Northeast corner
    );

    const mapProp = {
        center: new google.maps.LatLng(59.3678,10.4438),  
        /* rundkjøringen ved USN Bakkenteigen 59.36784716115497 10.44389835143527 */
        zoom: 10,
        restriction: {
            latLngBounds: norwayBounds,
            strictBounds: true
        }
    };
    const map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
    const geocoder = new google.maps.Geocoder();

    google.maps.event.addListener(map, 'click', function(event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        console.log('Clicked Coordinates:', lat, lng);
        placePin(lat, lng);
        reverseGeocode(lat, lng)
        .then(selectedLocation => fillForm(lat, lng, selectedLocation))
        .catch(error => console.error(error));
        
    });

    
    function placePin(lat, lng){
    console.log("placePin");
    if (window._taskMarker) window._taskMarker.setMap(null);
    window._taskMarker = new google.maps.Marker({
        position: { lat, lng },
        map,
    });
    }
    function reverseGeocode(lat, lng) {
        return new Promise((resolve, reject) => {
            console.log("reverseGeocode");
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status !== "OK" || !results) {
                    console.error("Reverse geocode failed:", status);
                    reject(new Error("Reverse geocode failed: " + status));
                    return;
                }
                const components = results[0].address_components;
                
                let selectedLocation = {
                    lat,
                    lng,
                    address: results[0].formatted_address,
                    municipality: extractComponent(components, "administrative_area_level_2")
                                || extractComponent(components, "locality")
                                || extractComponent(components, "administrative_area_level_1"),
                    county: extractComponent(components, "administrative_area_level_1"),
                };

                const display = document.getElementById("location-display");
                if (display) display.textContent = selectedLocation.municipality;

                resolve(selectedLocation); // ← Return the data here
            });
        });
    }
    function extractComponent(components, type) {
                    const match = components.find((c) => c.types.includes(type));
                    return match ? match.long_name : null;
                }
    function fillForm(lat, lng, selectedLocation){
        console.info(selectedLocation);
        console.log("lat: " + lat + " lng: " + lng);
        const kommuneInput = document.getElementById("kommune");
        const latInput = document.getElementById("lat");
        const lngInput = document.getElementById("lng");
        const tidInput = document.getElementById("tid");

        const timestamp = Date.now(); //millisekunder siden Unix-epoch
        const readableTimestamp = new Date(timestamp).toString();
        kommuneInput.value = selectedLocation.municipality;
        latInput.value = lat;
        lngInput.value = lng;
        tidInput.value = readableTimestamp;
      
    }
    

}
function createRegisterTaskForm() {
  const form = document.createElement('form');
  form.id = 'register-task';

  const fields = [
    { label: 'Task', id: 'oppgave', type: 'input', 'size' : 40, disabled: false },
    { label: 'Beskrivelse', id: 'oppdrag-beskrivelse', type: 'textarea', disabled: false },
    { label: 'Bruker', id: 'bruker', type: 'input', 'size' : 40, disabled: true },
    { label: 'E-post', id: 'e-post', type: 'input', 'size' : 40, disabled: true },
    { label: 'Kommune', id: 'kommune', type: 'input', 'size' : 40, disabled: true },
    { label: 'Longitude', id: 'lng', type: 'input', 'size' : 40, disabled: true },
    { label: 'Latitude', id: 'lat', type: 'input', 'size' : 40, disabled: true },
    { label: 'Timestamp', id: 'tid', type: 'input', 'size' : 40, disabled: true }
  ];

  fields.forEach(field => {
    const label = document.createElement('label');
    label.htmlFor = field.id;
    label.textContent = field.label;
    form.appendChild(label);

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.style.resize = 'vertical';
      input.style.width = "99%"
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.size = field.size;
    }

    input.id = field.id;
    input.required = true;
    if (field.disabled) input.disabled = true;
    form.appendChild(input);

    const br = document.createElement('br');
    form.appendChild(br);
  });
    const submitBtn = document.createElement('button');
    submitBtn.textContent = "Lagre";
    submitBtn.type = "button";
    submitBtn.addEventListener('click',async ()=>{
        console.log("submit");
        const FORM = document.getElementById('register-task');
        const valgtKommune = document.getElementById('kommune');
         if (!FORM.checkValidity()) {
            FORM.reportValidity(); 
            return; // Stop execution
        }
        if(valgtKommune.value === ""){
            console.log("kommune ikke valgt - brukeren må få beskjed");
            return;
        }
        let docID = await setTask(0,gatherPayload());
        console.info ("Sent");
        console.info ("ID: " + docID);

    });
    form.appendChild(submitBtn);

  return form;
}
 function gatherPayload(){
    
    const oppgaveinput = document.getElementById( 'oppgave').value;
    const oppdragBeskrivelseInput = document.getElementById('oppdrag-beskrivelse').value;
     const brukerInput = document.getElementById('bruker').value;
     const ePostInput = document.getElementById('e-post').value;
    const kommuneInput = document.getElementById('kommune').value;
    const lngInput = document.getElementById('lng').value;
     const latInput = document.getElementById('lat').value;
    const tidInput = document.getElementById('tid').value;
    let tag1 ="tag1"; let tag2 = "tag2";
  let payload = { 
                    title           :oppgaveinput,
                    description     :oppdragBeskrivelseInput,
                    status          : "open",
                    meta            : {     created: Date.now(),
                                            tags: [tag1, tag2]
                                        },
                    assignee        : {  uid: brukerInput,
                                        ePost: ePostInput },
                    location        : { "kommune"       : kommuneInput,
                                        "longitude"    : lngInput, 
                                        "latitude"      : latInput
                                    }
                    };
    return payload;
  
 }

const imageURLs = [
  "https://firebasestorage.googleapis.com/v0/b/app200v-team11.firebasestorage.app/o/ekornblomst-90x90.png?alt=media&token=a63cda7a-81e2-4ee2-8657-e43a84d42418",
  "https://firebasestorage.googleapis.com/v0/b/app200v-team11.firebasestorage.app/o/ekorn54x54.png?alt=media&token=1af4a4aa-298e-4381-80c6-3fd1b73d5bc9",
  "https://firebasestorage.googleapis.com/v0/b/app200v-team11.firebasestorage.app/o/deer54x54.png?alt=media&token=60f2af4e-ca14-4b97-a218-12e424919be0"
];

/**
 * 
 *    Koden under er brukt til å lage fikitve oppdrag - tasks
 *    Hver oppdrag har en del informasjon
 * 
 *    For å se at sortering og filtrering fungerer er trenger vi spredning.
 *    Tilfeldig utvalg fra 1-6 for rating for eksempel
 * 
 *    Koordinater og stedsnavn:
 *    Vi har tatt utgangspunkt i et referansepunkt og koden under lager oppdrag som 
 *    er innenfor forskjellige avstander fra refereansepunktet: 5 , 10 , 20 eller 200 km 
 *    fra referansepunktet. Det er fordi brukerne kan velge disse avstandende fra sitt
 *    eget referansepunkt.
 * 
 *    Koden selvfølgelig overflødig men psudodata er vikitg for å se at 
 *    web-applikasjonen gjør det den skal
 * 
 * 
 * 
 * 
 */
async function generateFictiveTasks() {

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

  const communes = [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Kristiansand",
    "Tromsø", "Fredrikstad", "Sandnes", "Drammen", "Skien"
  ];

  const tags = [
    "urgent", "maintenance", "repair", "electrical", "plumbing",
    "carpentry", "painting", "landscaping", "roofing", "inspection"
  ];

  const userUIDs = [
    "user001", "user002", "user003", "user004", "user005",
    "user006", "user007", "user008", "user009", "user010"
  ];

  const categories = ["Hage", "IT & Teknikk", "Rengjøring", "Flytting", "Montering", "Transport", "Undervisning", "Maling", "Rydding", "Annet"];


/*  
    For at vi skal få treff fra forskjellige distanser, så vi ser at koden fungerer, 
    er referansepunkt (59.27, 10.42 = Tønsberg) brukt for å generere oppdrag innenfor forskjellige 
    avstander fra refereansepunktet.

*/
const communesByZone = {
  5: [
    { name: "Tønsberg sentrum"        , latitude: 59.2723, longitude: 10.4179 },
    { name: "Sem"                     , latitude: 59.2950, longitude: 10.3800 },
    { name: "Teie (Nøtterøy)"        , latitude: 59.2450, longitude: 10.4050 },
    { name: "Vallø"                   , latitude: 59.2500, longitude: 10.4700 },
    { name: "Borgheim"                , latitude: 59.2300, longitude: 10.3900 },
    { name: "Eik"                     , latitude: 59.2850, longitude: 10.4500 },
    { name: "Byskogen"                , latitude: 59.2600, longitude: 10.4300 },
  ],
  10: [
    { name: "Stokke"                  , latitude: 59.2200, longitude: 10.2950 },
    { name: "Skoppum"                 , latitude: 59.3300, longitude: 10.3500 },
    { name: "Åsgårdstrand"            , latitude: 59.3450, longitude: 10.4650 },
    { name: "Nøtterøy sør"           , latitude: 59.1950, longitude: 10.4200 },
    { name: "Re (Revetal)"            , latitude: 59.2900, longitude: 10.2700 },
    { name: "Borre"                   , latitude: 59.3700, longitude: 10.4500 },
    { name: "Smørbukk"               , latitude: 59.2400, longitude: 10.5100 },
  ],
  20: [
    { name: "Sandefjord"              , latitude: 59.1310, longitude: 10.2167 },
    { name: "Horten"                  , latitude: 59.4144, longitude: 10.4817 },
    { name: "Holmestrand"             , latitude: 59.4900, longitude: 10.3200 },
    { name: "Tjøme"                   , latitude: 59.1200, longitude: 10.4100 },
    { name: "Andebu"                  , latitude: 59.2000, longitude: 10.1600 },
    { name: "Stokke (ytre)"          , latitude: 59.1700, longitude: 10.2900 },
    { name: "Sande"                   , latitude: 59.5900, longitude: 10.2200 },
    { name: "Hvasser"                 , latitude: 59.1050, longitude: 10.4600 },
    { name: "Ramnes"                  , latitude: 59.3300, longitude: 10.1900 },
  ],
  200: [
    { name: "Oslo"                    , latitude: 59.9139, longitude: 10.7522 },
    { name: "Drammen"                 , latitude: 59.7440, longitude: 10.2045 },
    { name: "Skien"                   , latitude: 59.2090, longitude:  9.6100 },
    { name: "Bergen"                  , latitude: 60.3913, longitude:  5.3221 },
    { name: "Trondheim"               , latitude: 63.4305, longitude: 10.3951 },
    { name: "Stavanger"               , latitude: 58.9700, longitude:  5.7331 },
    { name: "Kristiansand"            , latitude: 58.1467, longitude:  7.9956 },
    { name: "Tromsø"                  , latitude: 69.6489, longitude: 18.9551 },
  ],
};
function getLocationWithCoords(zone) {
  const zones = [5, 10, 20, 200];
  if (zone === undefined) zone = zones[Math.floor(Math.random() * zones.length)];
  const pool   = communesByZone[zone];
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const coords = random3km(chosen.latitude, chosen.longitude, 3);
  return {
    kommune:   chosen.name,
    latitude:  coords.latitude,
    longitude: coords.longitude,
  };
}

/* random3km finner tilfeldig koordinater innenfor en radius av 3km fra baseLat, baseLon. */ 
function random3km(baseLat, baseLon ) {
  const radiusKm = 3;
  const earthRadiusKm = 6371;

  // 1. Random distance with uniform distribution (avoid clustering in center)
  // If we just did random * radius, points would cluster in the middle.
  const r = radiusKm * Math.sqrt(Math.random());

  // 2. Random angle (0 to 360 degrees)
  const theta = Math.random() * 2 * Math.PI;

  // 3. Convert distance to degrees
  // Latitude is constant: ~111.32 km per degree
  const latOffset = (r / 111.32) * Math.cos(theta);
  
  // Longitude varies by latitude: ~111.32 * cos(lat) km per degree
  const lonOffset = (r / (111.32 * Math.cos(baseLat * Math.PI / 180))) * Math.sin(theta);

  return {
    latitude: baseLat + latOffset,
    longitude: baseLon + lonOffset
  };
}

  function generateEmail(uid) { return `${uid}@example.com`; }

  function getRandomTags() {
    const numTags = Math.floor(Math.random() * 3) + 1;
    const selectedTags = [];
    for (let i = 0; i < numTags; i++) {
      selectedTags.push(tags[Math.floor(Math.random() * tags.length)]);
    }
    return [...new Set(selectedTags)];
  }
  function buildPayload(location) {
    const randomUID = userUIDs[Math.floor(Math.random() * userUIDs.length)];
    return {
      title:       titles[Math.floor(Math.random() * titles.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      status:      "open",
      pris:        Math.floor(Math.random() * 99) * 100 + 100,
      category:    categories[Math.floor(Math.random() * categories.length)],
      urgent:      Math.random() < 0.2,
      meta: {
        created: firebase.firestore.FieldValue.serverTimestamp(),
        tags:    getRandomTags()
      },
      assignee: {
        uid:   randomUID,
        ePost: generateEmail(randomUID)
      },
      location,
      images: [ imageURLs[Math.floor(Math.random() * imageURLs.length)] ],
      rating: Math.floor(Math.random() * 6) + 1
    };
  }
  
  const tasks = [];
  // Guarantee at least one task per zone
  for (const zone of [5, 10, 20, 200]) {
    const location = getLocationWithCoords(zone); // pass zone as argument
    tasks.push(buildPayload(location));
  }

  // Fill remaining 46 randomly
  
  for (let i = 0; i < 46; i++) {
    const location = getLocationWithCoords(); // picks zone randomly as before
    tasks.push(buildPayload(location));
  }

  
  return tasks;
  
}
async function createAllFictiveTasks() {
  const tasks = await generateFictiveTasks();
  for (let i = 0; i < tasks.length; i++) {
    try {
      const docID = await setTask("", tasks[i]);
      console.log(`Task ${i + 1}/50 created with ID: ${docID}`);
    } catch (error) {
      console.error(`Failed to create task ${i + 1}:`, error);
    }
  }

  console.log("All 50 fictive tasks created!");
}
//Lager 50 oppgaver til databasen
        createAllFictiveTasks();

        /*
let tempTasks = await generateFictiveTasks();

const user = {lat : 59.272349982043586,lng : 10.417871475219727 }
let userDistance = [];

tempTasks.forEach(oppdrag=>{
  userDistance.push({
      tittel: oppdrag.title,
      sted: oppdrag.location.kommune,
      avstand: haversine(user.lat,user.lng,oppdrag.location.latitude,oppdrag.location.longitude)
   });
});
 console.table(userDistance);
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.asin(Math.sqrt(a)); // returns km
}

const ti = [
    { name: "Stokke"                  , latitude: 59.2200, longitude: 10.2950 },
    { name: "Skoppum"                 , latitude: 59.3300, longitude: 10.3500 },
    { name: "Åsgårdstrand"            , latitude: 59.3450, longitude: 10.4650 },
    { name: "Nøtterøy sør"           , latitude: 59.1950, longitude: 10.4200 },
    { name: "Re (Revetal)"            , latitude: 59.2900, longitude: 10.2700 },
    { name: "Borre"                   , latitude: 59.3700, longitude: 10.4500 },
    { name: "Smørbukk"               , latitude: 59.2400, longitude: 10.5100 },
  ];
  
  let avstand = ti.map(p => {
  return {
    name: p.name,
    distance: haversine(user.lat, user.lng, p.latitude, p.longitude)
  };
});
console.table(avstand);   
*/