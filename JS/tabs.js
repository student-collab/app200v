/*
gjemmer alle vinduene untatt første "tab"
Alle knappene blir knyttet til samme funksjon
Id til vinduene er lagret i dataset og kan fiskes frem
showTab sammenligner id til hver og en "tab" med id som er
lagret i klikket knapp sitt datasett. Bruker resultatet, som er 
boolean, direkte som verdi for tab.hidden

Strukturen i HTML er nøkkelen 
*/
window.addEventListener('load', ()=>{
    document.querySelectorAll('.tabs').forEach(tab => {
        tab.hidden = tab.id !== "tab-fordeler";
    });
    addListeners();
});

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


    
    
     