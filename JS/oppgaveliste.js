import { getTasks,
        getTask,
        
} from './modules/FS_Requests.js'; 

window.addEventListener('load', contentLoader);
let mainInfo = []; // For info som skal vises på skjermen

const CATEGORY_ICONS = {
    'Hage':         'shovel',        // or 'flower-2' if shovel missing
    'IT & Teknikk': 'monitor',
    'Rengjøring':   'sparkles',
    'Flytting':     'truck',
    'Montering':    'wrench',
    'Transport':    'package',
    'Undervisning': 'book-open',
    'Maling':       'paint-roller',  // or 'brush'
    'Rydding':      'trash-2',
    'Annet':        'circle-help',
};
function lagerKlasser(text) {
    return text
        .toLowerCase()
        // Map Norwegian chars and & in one pass, or handle & separately if needed
        .replace(/[øæå&]/g, (match) => {
            if (match === 'ø') return 'o';
            if (match === 'æ') return 'ae';
            if (match === 'å') return 'a';
            return ''; // Remove &
        })
        // Replace remaining non-alphanumeric with hyphen
        .replace(/[^a-z0-9]+/g, '-')
        // Trim hyphens
        .replace(/^-+|-+$/g, '');
}   
/*  Oppretter nytt objekt CSS_slugs. Nøklene er kategoriene som i CATEGORY_ICONS
    verdiene er kategorinavn behandlet av lagerKlasser                                 */
const CSS_slugs = Object.fromEntries(
    Object.keys(CATEGORY_ICONS).map(cat => [cat, lagerKlasser(cat)])
);

console.table(CSS_slugs);


/* ------------------ hjelpefunksjon ------------ */
function prepRender (task) {
    const roll = Math.floor(Math.random() * 6) + 1;   //rating er ikke på plass enda

  let infoTask = {
        id: task.id,    
        title: task.title, 
        pris: task.pris,
        kommune: task.location.kommune,
        kategori: task.category,
        rating: roll
    }
    mainInfo.push(infoTask);
}

async function contentLoader () {
    console.log("Fetching tasks from FireStore");
    let myData = await getTask();
    
    myData.forEach ((task)=> prepRender(task));  
    renderTasks();

    /*
    Lastes OPP
        let payload =  {
        title: "", description: "", status: "open", pris: 0,
        meta: {},
        assignee: { uid: "", ePost: "" },
        location: { kommune: "", longitude: 0, latitude: 0 },
        images: []
    };
    */
   
console.log("rendering");
//renderTasks(mineOppgaver);
}
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
        location.append(task.kommune);

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