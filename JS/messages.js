
import { db} from '../JS/modules/dbConfig.js'; 

window.addEventListener('load', ()=>{
    const fetch = document.getElementById('hent-oppgaver');
    fetch.addEventListener('click', fetchData);
    
});

async function fetchData (){
    // Henter verdiene fra skjermen
    const taskLat = parseFloat(document.getElementById('lat').value);
    const taskLng = parseFloat(document.getElementById('lng').value);
    const taskRadius = parseFloat(getRadius());
    // byttes til midlertidig hardkoding

    console.log('getBounding: Lat: ' + taskLat + " Lng: " + taskLng + " Radius: " + taskRadius);
    const myTasks = await getTasksByDistance(taskLat, taskLng, taskRadius);
    // Lager en liste og en li for hver tittel
    // Her kommer prepRender inn 
    let list = document.createElement('ul');
    myTasks.forEach(task=>{
        let title = document.createElement('li');
        title.textContent = task.title +  " distance: " + (Math.floor(task.distance*10))/10 ?? "Ukjent" ;
        list.appendChild (title);

    });
    const showTasks = document.getElementById('showtask');
    showTasks.innerHTML = "Tittel og avstand fra Tønsberg sentrum "
    showTasks.appendChild(list);
    
    
}

/* * * * * * * * * * * * * * * *
 *                             *
 *      Hjelpefunksjoner       *   
 *                             *
 * * * * * * * * * * * * * * * */

function getBoundingBox(lat, lng, radiusKm) {
    const latOffset = radiusKm / 111;
    const lngOffset = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return {
        minLat: lat - latOffset,
        maxLat: lat + latOffset,
        minLng: lng - lngOffset,
        maxLng: lng + lngOffset
    };
}

function getRadius (){
    const optionButtons = document.getElementsByName('distance');

    for (let i = 0; i < optionButtons.length; i++) {
        if (optionButtons[i].checked) {
            return optionButtons[i].value
        }
    }   
}

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

/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
*                                                           *
*   getTasksByDistance bruker så mange hjelpefunksjoner     *
*   Er bare nyttig for oppgavelisten                        *
*                                                           *
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


const MAX_RADIUS = 20; // Justeres til å være høyeste brukervalg

let cachedTasks = null; // For å unngå ekstra spørringer ved bytte av avstand

async function getTasksByDistance(userLat, userLng, radiusKm) {

    if(!cachedTasks){
        const box = getBoundingBox(userLat, userLng, MAX_RADIUS);
        const snap = await db.collection('tasks')
        .where('location.latitude', '>=', box.minLat)
        .where('location.latitude', '<=', box.maxLat)
        .get();
        cachedTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    const box = getBoundingBox(userLat, userLng, radiusKm);
    return cachedTasks
        .filter(task => {
            const lng = task.location.longitude;
            return lng >= box.minLng && lng <= box.maxLng;
        })
        .map(task => ({
            ...task,
            distance: haversine(userLat, userLng, task.location.latitude, task.location.longitude)
        }))
        .filter(task => task.distance <= radiusKm)   // trim the box corners
        .sort((a, b) => a.distance - b.distance);
}
