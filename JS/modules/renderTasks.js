/**
 * 
 *  Vi bruker Lucide icons. Et ikon for hver kategori, i datasettet CATEGORY_ICONS
 *  knyttes hvert kategorinavn til et ikon-navn. Kategorien leses ut av oppdraget
 *  og tilhørende ikon-navn settes inn. Script fra Lucide er lenket inn og gjør
 *  jobben med å sette inn riktig ikon på rett sted.
 * 
 *  CSS for Lucide ikoner:
 *  Vi har kategorinavn som ikke egner seg direkte som klassenavn. Funksjonen
 *  lagerklasser lager gjenkjennbare navn som kan brukes for de forskjellige
 *  kategori-ikonene. De lagres i vareiabelen CSS-slugs
 * 
 *  In web development, a slug is a user-friendly, 
 *  URL-safe string that uniquely identifies a specific page or resource, 
 *  typically derived from the page's title.  
 *  It appears in the URL after the domain name 
 *  (e.g., in example.com/my-blog-post, my-blog-post is the slug). 
 * 
 *  For å få brukt disse klassene bruker vi console.table og kopierer
 *  klasse-navnene derfra, disse er allerede knyttet til det respektive ikonet
 *  og vi kan lime rett inn i CSS.
 * 
 *  Kopiert fra konsoll:
            (index)                          Value
          --------------------------------------------------
            Hage	            |            'hage'
            IT & Teknikk	    |            'it-teknikk'
            Rengjøring	        |            'rengjoring'
            Flytting	        |            'flytting'
            Montering	        |            'montering'
            Transport	        |            'transport'
            Undervisning	    |            'undervisning'
            Maling	            |            'maling'
            Rydding	            |            'rydding'
            Annet	            |            'annet'
 * 
 * index er kategorinavn og Value er klassenavnet som er tilknyttet ikonet for kategorien,
 * det vil si at Vale klasser som kan brukes i CSS
 *
 */



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
/**
 * 
 * 
 * 
 * 
 */
 //console.table(CSS_slugs); // brukes for å manuelt kopiere CSS-klassene fra konsoll-terminal


/**
 * 
 *  Funksjonen renderTasks er bygget for et spesifikt objekt:
   {   
       "id":"0sO9XFZH8NW9Mdi3FLE4",
       "title":"Replace windows",
       "pris":9800,
       "kommune":"Hvasser",
       "kategori":"Rengjøring",
       "rating":4,
       "urgent":false,
       "distance":16.6
  }
 *  Dette er akkurat den informasjonen som skal til for å vise frem en oppgave som brukerne får se i oppgavelisten.
 *  Den vil også bli brukt når brukerne vil lagre oppgaver og se hvilke oppgver de har lagret
 *  Og når de vil se en liste over hvilke oppgaver de har potstet.
 * 
 * 
 */


export function renderTasks(tasksObject){
    const myDocFrag = document.createDocumentFragment();
    
    tasksObject.sort((a, b) => a.distance - b.distance).forEach(task => {
      
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

        const viewTask = document.createElement('span');
        viewTask.className = 'task__view-btn';
        viewTask.textContent = 'View Task >';
 
       // --- Bilde/ikon: bruk opplastet bilde hvis tilgjengelig, ellers kategoriikon ---
        const firstImage = Array.isArray(task.images) ? task.images[0] : null;
        let mediaElement;

        if (firstImage) {
            const taskImage = document.createElement('img');
            taskImage.src = firstImage;
            taskImage.alt = task.title || 'Task image';
            taskImage.className = 'task__img task__img--photo';
            mediaElement = taskImage;
        } else {
            const iconCategory = document.createElement('i');
            iconCategory.dataset.lucide = CATEGORY_ICONS[task.kategori] ?? 'circle-help';
            iconCategory.className = `task__img ${CSS_slugs[task.kategori]}`;
            mediaElement = iconCategory;
        }
        
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
        iWrap.appendChild(viewTask);
        yWrap.appendChild(iWrap);
                
        if (iconUrgent) {
            yWrap.appendChild(iconUrgent);
        }   
        yWrap.appendChild(mediaElement);
        myDocFrag.appendChild(yWrap);
    });
    return myDocFrag;
}