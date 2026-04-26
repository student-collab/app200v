window.addEventListener('load', contentLoader);
function contentLoader () {
    console.log("Fetching tasks from FireStore");
    const mineOppgaver = [
    {
        id: "abc123",
        title: "Flytte sofa",
        pris: 200,
        rating: 4.2,
        location: { kommune: "Oslo" },
        imgUrl: "../img/testSize/deer54x54.png"
    }
];
console.log("rendering");
renderTasks(mineOppgaver);
}
function renderTasks(tasks) {
    const insertInto = document.getElementById('oppgavelisten');
    if (!insertInto) {
        console.error("Fant ikke element med id 'oppgavelisten' ");
        return;
    }
    const myDocFrag = document.createDocumentFragment();
    tasks.forEach(task => {

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
        location.append(task.location.kommune);

        const rating = document.createElement('span');
        rating.className = 'task__rating';
        rating.innerHTML = '<svg width="1em" height="1em"><use href="#icon-star"/></svg>';
        rating.append(task.rating ?? '–');

        const price = document.createElement('span');
        price.className = 'task__price';
        price.textContent = `${task.pris} kr`;

        // --- Image ---
        const img = document.createElement('img');
        img.src = task.imgUrl ?? '../img/placeholder.png';
        img.alt = task.title;
        img.className = 'task__img';

        // --- Setter sammen ---
        infWrap.append(location, rating, price);
        iWrap.appendChild(title);
        iWrap.appendChild(infWrap);
        yWrap.appendChild(iWrap);
        yWrap.appendChild(img);
        myDocFrag.appendChild(yWrap);
    });
    insertInto.innerHTML = "";
    insertInto.appendChild(myDocFrag);
}