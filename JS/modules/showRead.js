/**
 * 
 * Tar imot JSON objekt - går gjennom alle nøkler og verdier
 * Lager UL og li med p i overskriftene
 * 
 * * * */
// elementet der data vises frem
const FRAME_SHOW_READ = document.getElementById("show_frame");

/* * *
 * 
 *  Funksjonen showResp 
 *  #1 tar i mot objektet 
 *  #2 lager et tomt dokumnetfragment 
 *  #3 kjører objectToHTML og setter inn det returnerte 
 *     dokumnetfragmentet
 * 
 * * * */
export function showResp(db){ 
    FRAME_SHOW_READ.innerHTML="";
    let docFrag = new DocumentFragment();
    docFrag = objectToHTML(db, "", docFrag);
    FRAME_SHOW_READ.appendChild(docFrag);
    console.log("Utført!");

}

/**
 * 
 * Funksjonen objectToHTML er en rekursiv funksjon
 * Den kaller på seg selv så lenge det finnes verdier
 * som innholder objekter.
 *                 key       value (value == objekt)         key  -   value  (value != objekt)
 *                  ^          ^                              ^         ^ 
 * Key- value -> 'brukere' : {007 : { 'navn': 'James Bond', 'email':B.James@gmail.com} }
 * 
 * * * * * * * * * * * * */

function objectToHTML(node, path = "", container) {
    // Hvis noden er null eller != objekt -> det vil si (string og tall bare ikke: {key:value}
    // Da har vi en underfordeling en node som er siste ledd -> en value som ikke er objekt
    if (node === null || typeof node !== 'object') {
      let li = document.createElement('li');
      li.textContent = path + " : " + node;
      container.appendChild(li);
      return; 
    }
    // Her er det avgjort at vi har en nøkkel-node og vi lager en ul for den
    let ul = document.createElement('ul');
    
    if (path == "") { 
        //path =="" -> kun første kjøring
        container.appendChild(ul);
    } else {
        // bruker path (= nøkkelnavn), lager ny overskrift li og 
        // putter neste UL inn i den
        let headingLi = document.createElement('li');
        let p = document.createElement('p');
        p.textContent = path;
        headingLi.appendChild(p);    
        headingLi.appendChild(ul);
        container.appendChild(headingLi);
    }

    for (let key of Object.keys(node)) { 
        path = key;
        objectToHTML(node[key], path, ul); 
        
    }
    return container;

}
