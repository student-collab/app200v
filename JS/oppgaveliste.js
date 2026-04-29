import {getTask} from './modules/FS_Requests.js'; 
import {db} from '../JS/modules/dbConfig.js'; 
const MAX_RADIUS = 20; // Justeres til å være høyeste brukervalg
const userLat = 59.272349982043586;
const userLng = 10.417871475219727; // Skal hentes fra innlogget bruker

window.addEventListener('load', ()=>{ 
    document.querySelectorAll('.segment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
                    
                // finner alle segment-knappene og fjerener aktiv-klassen, legger til aktiv på seg selv 
                    if (this.classList.contains('segment-btn--active')) return;
                    document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('segment-btn--active'));
                    this.classList.add('segment-btn--active');
                // Laster oppgavene
                    contentLoad ();
                    
                    
                });
            });
    contentLoad ();
});

function contentLoad () {
    // Finner tekstinnholdet på segmentknappen med aktiv-klassen
    const avstandTekst = document.querySelector('.segment-btn--active').textContent; 
    
    // Laster med eller uten avstandsfiltrering avhengig av tekstinnholdet
    if (avstandTekst == 'Alle'){
        taskLoader();
    }
    else{
        let avstand = 0;
        switch (avstandTekst) {
            case "5 km": avstand = 5; break;
            case "10 km":avstand = 10; break;
            default: avstand = MAX_RADIUS;
        }
        taskLoaderDistanceFilter(avstand);
    }
}
// Forskjellige kategorier for alle kategoriene
const CATEGORY_ICONS = {
    'Hage':         'shovel',        
    'IT & Teknikk': 'monitor',
    'Rengjøring':   'sparkles',
    'Flytting':     'truck',
    'Montering':    'wrench',
    'Transport':    'package',
    'Undervisning': 'book-open',
    'Maling':       'paint-roller',  
    'Rydding':      'trash-2',
    'Annet':        'circle-help',
};
/* * * * * *  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *      Lager klassenavn som blir brukt på forskjellige kategorier      *
 * * * * * *  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function lagerKlasser(text) {
    return text
    .toLowerCase()
    // erstatter norske spesialtegn og '&'
    .replace(/[øæå&]/g, (match) => {
        if (match === 'ø') return 'o';
        if (match === 'æ') return 'ae';
        if (match === 'å') return 'a';
        return ''; // Fjerner &
    })
    // Spesialtegn erstattes med '-'
    .replace(/[^a-z0-9]+/g, '-')
    // Fjerner '-' fra start og slutt
    .replace(/^-+|-+$/g, '');
}   
    /*  
            Oppretter nytt objekt CSS_slugs. 
            Nøklene er kategoriene, nøklene, fra CATEGORY_ICONS
            Verdiene er kategorinavn behandlet av lagerKlasser 
    */

const CSS_slugs = Object.fromEntries(
    Object.keys(CATEGORY_ICONS).map(cat => [cat, lagerKlasser(cat)])
);

// console.table(CSS_slugs); // brukes for å manuelt kopiere CSS-klassene fra konsoll-terminal


let mainInfo = []; // For info som skal vises på skjermen
/* 
        Hjelpefunksjon lager array med nye objekter som kun inneholder
        informasjon som skal vises på skjermen
*/
function prepRender (task) {
  const roll = Math.floor(Math.random() * 6) + 1;   //rating er ikke på plass enda
  
   let distanceKM = haversine(userLat, userLng, task.location.latitude, task.location.longitude)
   
  
  let infoTask = {
        id: task.id,    
        title: task.title, 
        pris: task.pris,
        kommune: task.location.kommune,
        kategori: task.category,
        rating: roll,
        distance:  (Math.floor(distanceKM * 10))/10
    }
    mainInfo.push(infoTask);
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Henter data fra FireStore kjører hvert dokument/oppdrag gjennom prepRender        *
 *   taskLoader laster uten avstandsberegning, uten filter                             *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

async function taskLoader () {
    console.log("Fetching tasks from FireStore");
    let myData = await getTask();
    
    myData.forEach ((task)=> prepRender(task));  
    renderTasks();
    console.log("Rendering");
}
    /*  --- --- --- Eksempel på payload brukes for å huske --- --- --- *
        let payload =  {
            title: "", description: "", status: "open", pris: 0,
            meta: {},
            assignee: { uid: "", ePost: "" },
            location: { kommune: "", longitude: 0, latitude: 0 },
            images: []
        };                                                                  
    */
   
async function taskLoaderDistanceFilter (taskRadius = MAX_RADIUS){
    
    const myTasks = await getTasksByDistance(userLat, userLng, taskRadius);
    
    myTasks.forEach ((task)=> prepRender(task));  
    renderTasks();
    console.log("Rendering");
}

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




let cachedTasks = null; // For å unngå ekstra spørringer ved bytte av avstand

export async function getTasksByDistance(userLat, userLng, radiusKm) {

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

/* * * * * *  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *      Genererer HTML for informasjon som skal vises på skjerm         *
 * * * * * *  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
function renderTasks() {
    const insertInto = document.getElementById('oppgavelisten');
    if (!insertInto || mainInfo.length == 0) {
        console.error("Mangler element 'oppgavelisten' eller mangler data fra FireBase");
        return;
    }
    const myDocFrag = document.createDocumentFragment();
    mainInfo.forEach(task => {

/*
Hvert kort består av:
        - ytre wrap (yWrap) med id=task-<nr> og class=tasak
        - indre wrap (iWrap)for alt untatt kategorimarkør
            - H2 overskrift
            - info wrap (infWrap) for flex
                -span
                    -SVG
                    -tekst
                -span
                    -SVG
                    -tekst
                -span
                    -tekst
        - kategorimarkør (bilde/icon med farge)


*/

        /// --- To wrap for skille mellom bilde og resten ---
        const yWrap = document.createElement('a');
        yWrap.id = `task-${task.id}`;
        yWrap.className = 'task';
        yWrap.href=`/pages/postedTaskDetail.html?id=${task.id}`;

        
        const iWrap = document.createElement('div');
        iWrap.className = 'task__main';

        // --- Overskrift ---
        const title = document.createElement('h2');
        title.className = 'task__title';
        title.textContent = task.title;

        // --- Info wrap - flexbox ---
        const infWrap = document.createElement('div');
        infWrap.className = 'task__info';
        const location = document.createElement('span');
        location.className = 'task__location';
        location.innerHTML = '<svg width="1em" height="1em"><use href="#icon-location"/></svg>';
        location.append(task.kommune + ' ' + task.distance + ' km');

        const rating = document.createElement('span');
        rating.className = 'task__rating';
        rating.innerHTML = '<svg width="1em" height="1em"><use href="#icon-star"/></svg>';
        rating.append(task.rating ?? '–');

        const price = document.createElement('span');
        price.className = 'task__price';
        price.textContent = `${task.pris} kr`;
 
       // --- Icon ---
        const icon = document.createElement('i');
        icon.dataset.lucide = CATEGORY_ICONS[task.kategori] ?? 'circle-help';
        icon.className = `task__img ${CSS_slugs[task.kategori]}`;

        // --- Setter sammen ---
        infWrap.append(location, rating, price);
        iWrap.appendChild(title);
        iWrap.appendChild(infWrap);
        yWrap.appendChild(iWrap);
                
                
        yWrap.appendChild(icon);
        myDocFrag.appendChild(yWrap);
    });
    insertInto.innerHTML = "";
    insertInto.appendChild(myDocFrag);
    lucide.createIcons();
    console.info(CSS_slugs);
}