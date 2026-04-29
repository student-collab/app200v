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
                                        "longditude"    : lngInput, 
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

async function generateFictiveTasks() {
  const tasks = [];

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

  function getRandomNorwegianCoords() {
    const myLat = 59.272349982043586;
    const myLon = 10.417871475219727;
    const randomIndex = Math.floor(Math.random() * 4);
    const taskRadius = [5, 10, 20, 200][randomIndex];
   return  getRandomCoordsWithinRadius(myLat, myLon, taskRadius);
  }
/* Trenger at det finnes oppgaver innenfor bestemt avstand fra gitt punkt */
function getRandomCoordsWithinRadius(baseLat, baseLon, radiusKm) {
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

  for (let i = 0; i < 50; i++) {
    const randomUID = userUIDs[Math.floor(Math.random() * userUIDs.length)];
    const coords = getRandomNorwegianCoords();

    const payload = {
      title:       titles[Math.floor(Math.random() * titles.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      status:      "open",
      pris:        Math.floor(Math.random() * 99) * 100 + 100, // 100–9900 i steg på 100
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
      location: {
        kommune:   communes[Math.floor(Math.random() * communes.length)],
        longitude: coords.longitude,
        latitude:  coords.latitude
      },
      images: [ imageURLs[i % imageURLs.length] ]
    };

    tasks.push(payload);
  }

  return tasks;
}

async function createAllFictiveTasks() {
  const tasks = await generateFictiveTasks();

  for (let i = 0; i < tasks.length; i++) {
    try {
      const docID = await setTask("", tasks[i]);
      console.log(`Task ${i + 1}/20 created with ID: ${docID}`);
    } catch (error) {
      console.error(`Failed to create task ${i + 1}:`, error);
    }
  }

  console.log("All 20 fictive tasks created!");
}
//Lager 50 oppgaver til databasen
//createAllFictiveTasks();