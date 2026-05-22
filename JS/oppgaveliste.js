import {db} from '../JS/modules/dbConfig.js'; 
import { headerReady } from './main.js';

const MAX_RADIUS = 20; // Justeres til å være høyeste brukervalg
const userLat = 59.272349982043586;
const userLng = 10.417871475219727; // Skal hentes fra innlogget bruker
/*
lat:59.272349982043586; lng:10.417871475219727; // Skal hentes 
*/
window.addEventListener('load', ()=>{ 
    document.querySelectorAll('.segment-btn').forEach(btn => {
        btn.addEventListener('click', function(){
                    
                // finner alle segment-knappene og fjerner aktiv-klassen, legger til aktiv på seg selv 
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
let nearbyTasks = 0;
/* 
        Hjelpefunksjon lager array med nye objekter som kun inneholder
        informasjon som skal vises på skjermen
*/
function prepRender (task) {
 let distanceFloat = task.distance ?? haversine(userLat, userLng, task.location.latitude, task.location.longitude) 
  let distanceRounded = Math.floor(distanceFloat * 10)/10;
  let infoTask = {
        id: task.id,    
        title: task.title, 
        pris: task.pris,
        kommune: task.location.kommune,
        kategori: task.category,
        rating: task.rating,
        urgent:task.urgent,
        distance: distanceRounded
    }
     if (mainInfo.length === 0 && false){ 
        nearbyTasks = 0;
            console.log('first task in cachedTask before sorting:')
            console.table(Object.keys(task));
            console.table(Object.keys(infoTask));
            console.info ("Stored object:\n" + JSON.stringify(task, null,3)  + "\n\nRendered object\n" + JSON.stringify(infoTask, null,3))
    }
    if(infoTask.distance <= 5) nearbyTasks ++;
    mainInfo.push(infoTask);
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *   Henter data fra FireStore kjører hvert dokument/oppdrag gjennom prepRender        *
 *   taskLoader laster uten avstandsberegning, uten filter                             *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

async function taskLoader () {
    mainInfo = [];
    try{
        console.log("Fetching tasks from FireStore");
        const snap = await db.collection('tasks').get();
        const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        tasks.forEach(task => prepRender(task));
        renderTasks();
        console.log("Rendering");
    } catch (err) {
        console.error("Feil ved henting av oppgaver:", err);
        document.getElementById('oppgavelisten').innerHTML =
            '<p style="padding:2em;color:#c00;">Kunne ' 
            + 'ikke laste oppgaver. Sjekk internettforbindelsen og prøv igjen.</p>';
    }
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
   
let cachedTasks = null; // For å unngå ekstra spørringer ved bytte av avstand

async function taskLoaderDistanceFilter (taskRadius = MAX_RADIUS){
     mainInfo = [];

    try{
         if(!cachedTasks){
        const max_box = getBoundingBox(userLat, userLng, MAX_RADIUS);
        const snap = await db.collection('tasks')
        .where('location.latitude', '>=', max_box.minLat)
        .where('location.latitude', '<=', max_box.maxLat)
        .get();
        cachedTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(task => {
            const lng = task.location.longitude;
            return lng >= max_box.minLng && lng <= max_box.maxLng;
        })
    }
    const box = getBoundingBox(userLat, userLng, taskRadius);
    /* Filtrering av oppdragene: reduce tar med seg tasksWithinRadius for hver iterasjon over elementene i cashedTasks -> task  */
    const newMainInfo = cachedTasks.reduce((tasksWithinRadius, task) => {
        const { longitude: lng, latitude: lat } = task.location; // deconstruct -- tillegger lng og lat verdiene fra task.location.lat -- istedet for property accessing: const lng = task.location.longitude; + ... en gang til for lat

        if (lng < box.minLng || lng > box.maxLng ||
            lat < box.minLat || lat > box.maxLat) return tasksWithinRadius; // ingen endring i tasksWithinRadius == filtrerte bort oppgaven

        const distance = haversine(userLat, userLng, lat, lng);
        if (distance > taskRadius) return tasksWithinRadius;

        tasksWithinRadius.push({ ...task, distance });            // alle nøklene fra objektet legges inn i nytt objekt sammen med ny nøkkel og veridpar ---> distance : "distance-verdi"
        return tasksWithinRadius;                                // tasksWithinRadius returneres med den nye oppgaven lagt til == filtrerte ikke bort oppgaven
    }, []); // [] == initial verdi for tasksWithinRadius
    newMainInfo.forEach ((task)=> prepRender(task));  
    renderTasks();

    } catch (err) {
        console.error("Feil ved henting av oppgaver:", err);
        document.getElementById('oppgavelisten').innerHTML =
            '<p style="padding:2em;color:#c00;">Kunne '
            +'ikke laste oppgaver. Sjekk internettforbindelsen og prøv igjen.</p>';
    }
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



/* * * * * *  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *      Genererer HTML for informasjon som skal vises på skjerm         *
 * * * * * *  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
function renderTasks() {
    const insertInto = document.getElementById('oppgavelisten');
    if (!insertInto) {
    console.error("Mangler element 'oppgavelisten'");
    return;
    }
    if (mainInfo.length === 0) {
        insertInto.innerHTML = '<p>Ingen oppgaver funnet i dette området.</p>';
        return;
    }
    const myDocFrag = document.createDocumentFragment();
    
    document.getElementById('nearby-tasks').textContent = nearbyTasks;
    mainInfo.sort((a, b) => a.distance - b.distance).forEach(task => {
      
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
        const iconCategory = document.createElement('i');
        iconCategory.dataset.lucide = CATEGORY_ICONS[task.kategori] ?? 'circle-help';
        iconCategory.className = `task__img ${CSS_slugs[task.kategori]}`;
        
        let iconUrgent = null;
        if (task.urgent){
            iconUrgent = document.createElement('i');
            iconUrgent.dataset.lucide = 'circle-alert';
            iconUrgent.className = 'icon-urgent';
        }

        // --- Setter sammen ---
        infWrap.append(location, rating, price);
        iWrap.appendChild(title);
        iWrap.appendChild(infWrap);
        yWrap.appendChild(iWrap);
                
        if (iconUrgent) {
            yWrap.appendChild(iconUrgent);
        }   
        yWrap.appendChild(iconCategory);
        myDocFrag.appendChild(yWrap);
    });
    insertInto.innerHTML = "";
    insertInto.appendChild(myDocFrag);
    lucide.createIcons();
}
/* * * * * * * * * * * * * * * * * * * * * * * *
*        Søkefelt kommer og går med scroll     *
* * * * * * * * * * * * * * * * * * * * * * * **/


headerReady.then(() => {
    adjustSearchField();
});    

function adjustSearchField(){
    const header = document.getElementById('inserted-header');
    console.info(header);
    let headerHeight =  header.getBoundingClientRect().bottom;
    
    const searchBar = document.getElementById('search-field-and-info');
    const searchHeight = searchBar.offsetHeight;
    searchBar.style.top = headerHeight + 'px';
    headerHeight -= 10;
    
    const oppgavelisten = document.getElementById('oppgavelisten');
    oppgavelisten.style.paddingTop = searchHeight + 'px';

    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - lastScrollY) < 5) return;
        
        const headerGone = currentScrollY > headerHeight;
        searchBar.style.top = headerGone ? '0' : headerHeight + 'px';
        searchBar.classList.toggle('search--hidden', currentScrollY > lastScrollY);
        console.log(headerGone);
        lastScrollY = currentScrollY;
    });
    
    
    
}




