import {auth} from './modules/dbConfig.js';

import {getTask, getUser, setTask} from './modules/FS_Requests.js'; 
import { getDroppedFiles, clearDroppedFiles } from './modules/postTask-fileDrop.js';
import { insertMap, getPinnedLoacationData } from './modules/insertGoogleMaps.js';

let currentTaskId = null; // Ved redigering brukes id fra URL
let survivingImages = []; // Eksisterende bilde-url brukeren kan redusere
// Redigering oppdages i window load, verdier fra database vises i feltene
function prepareEdit(task) {
    document.getElementById("task-title").value       = task.title       ?? "";
    document.getElementById("kategori").value         = task.category    ?? "";
    document.getElementById("beskrivelse").value      = task.description ?? "";
    document.getElementById("urg-toggle-btn").checked = task.urgent      ?? false;

    const slider = document.getElementById("pris-slider");
    const output = document.getElementById("viser-pris");
    slider.value = task.pris ?? 0;
    output.value = task.pris ?? 0;
console.log(task.images);
    survivingImages = [...(task.images ?? [])];
    renderExistingImages();

}

window.addEventListener('load', ()=>{
    
    // Leser id ut av URL-en
    const id = new URLSearchParams(window.location.search).get('id');
    if (id){
        currentTaskId = id;
        getTask(id).then((task) => {
            prepareEdit(task);
            insertMap(task.location ?? null);
        });
        
    }
        
    /* ----------- post-task-knappen ---------------------------- */
    const submitButton = document.getElementById("btn-post-task");
    submitButton.addEventListener('click',async ()=> postingTask());
    /* ----------- tøm-skjema-ikonet ---------------------------- */
    const clearPostTaskForm = document.getElementById("clear-form");
    const postTaskForm = document.getElementById("form__post-task");
    clearPostTaskForm.addEventListener('click',()=>postTaskForm.reset());
    
    /* ----------- pris-slider ---------------------------- */
    const slider = document.getElementById("pris-slider");
    const output = document.getElementById("viser-pris");

    slider.addEventListener("pointerdown", bigOutputDuringSlide);
    slider.addEventListener("pointerup",  normalOutput );
    slider.addEventListener("touchstart", bigOutputDuringSlide);
    slider.addEventListener("touchend",  normalOutput);
    output.value = slider.value; // Justerer visningen til sliders default value
    /*
          Regler for slider og visning av verdi kalt output
          #1 Slider og output skal vise samme tall
          #2 Hvis brukeren velger større en max: juster til max
          #3 Hvis brukeren velger mindre en minimum: juster til minimum
    */
    slider.oninput = function() { output.value = this.value;}                           //#1
    
        output.addEventListener('focusout', () => {
        if (Number(output.value) > Number(slider.max)) {output.value = slider.max;}     //#2
        if (Number(output.value) < Number(slider.min)) {output.value = slider.min;}     //#3
        if (slider.value != output.value) { slider.value = output.value;}
    
});   
    
    
    // Når brukeren endrer tallet vises det større fordi det interesserer brukeren i øyeblikket
    function bigOutputDuringSlide (){output.classList.add("sliderActive")}
    function normalOutput (){output.classList.remove("sliderActive")}
})
    
async function postingTask (){
/* * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *  Henter brukerens id, avbryter hvis ikke funnet     *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const user = auth.currentUser;
        if (!user) return;

/* * * * * * * * * * * * * * * * * * *
 *  Sjekker at alle felt er utfylt   *
 * * * * * * * * * * * * * * * * * * */
        const FORM = document.getElementById('form__post-task');
        if (!FORM.checkValidity()){
            FORM.reportValidity(); 
            return; // Stopper hvis skjema ikke er fylt
        }
        
        /* * * * * * * * * * * * * * * * * * * * * * * * *
        *  Definering av payload, objekt for sending    *
        * * * * * * * * * * * * * * * * * * * * * * * * */
       const payload ={
           status:"open", 
           urgent:false,
           title: "", 
           category:"", 
           description: "", 
           pris: 0,
           createdBy: { displayName:"", uid: "", ePost: "" },
           created:0,
           assignee: { pendingRequest:[], uid: "", ePost: "" },
           location: { kommune: "", longitude: 0, latitude: 0 },
           urgent: false,
           images: []
        };    
        /* * * * * * * * * * * * * * * * * * * *
        *  Manuell innsamling av formdata     *
        * * * * * * * * * * * * * * * * * * * */
       const valgtPris = document.getElementById("viser-pris").value;
       // Status skal være "open"
       payload.urgent      = document.getElementById("urg-toggle-btn").checked;
       payload.title       = document.getElementById("task-title").value;
       payload.category    = document.getElementById("kategori").value;
       payload.description = document.getElementById("beskrivelse").value;
       payload.pris = Number(valgtPris);
       payload.createdBy = { displayName:user.displayName, uid: user.uid, ePost: user.email };
       payload.created = firebase.firestore.FieldValue.serverTimestamp();
       //asignee skal være tom
       payload.location = getPinnedLoacationData();
        /**
        *       Bilder sendes separat til setTask 
        *       Først lagres bilder i storage bucket, en url returneres.
        *       Den returnerte url-en føyes til payload
        */
        const imageFiles = getDroppedFiles(); // postTask-fileDrop.js 
        /* * * * * * * * * * * * * * * * * * * * * * * * * * * *
        *  Opplasting til Firebase, skjer i FS_requests.js    *
        * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        console.log("Testing no upload");
        console.log("Payload");
        console.log(JSON.stringify(payload));
        console.log("imageFiles");
        console.log(imageFiles);
        console.log("survivingImages");
        console.log(survivingImages);
/*
        const docID = await setTask(
                    currentTaskId ?? "",   // Ved redigering er det en id
                    payload,
                    imageFiles,
                    survivingImages
            );
        console.info("Ferdig, ID:", docID);
        */
        // Sletter intern fil-liste og tømmer den synlige fil-listen
        clearDroppedFiles(); 
        window.location.href = `/pages/postedTaskDetail.html?id=${encodeURIComponent(docID)}`;
        
    }
    
function renderExistingImages() {
    document.getElementById("existing-images")?.remove();

    if (survivingImages.length === 0) return;

    const existingImagesContainer = document.createElement("div");
    existingImagesContainer.id = "existing-images";
    
    survivingImages.forEach((url, i) => {
        const item = document.createElement("div");
        item.className = "existing-image-item";

        const name = document.createElement("span");
        const imgName = `Bilde ${i + 1}`;
        const imgId = 'Bilde'+(i+1); 
        name.textContent = imgName;
        name.id = 'span_' + imgId;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerHTML = "Slett bildet";
        btn.dataset.imgName = imgName;
        btn.dataset.imgId = imgId;
        btn.addEventListener("click", (e) => {
            survivingImages.splice(survivingImages.indexOf(url), 1);
            const myBtn = e.target;
            const imgId = myBtn.dataset.imgId;
            const imgName = myBtn.dataset.imgName;
            const myIMG = document.getElementById(imgId);
            myIMG.classList.toggle('markedDelete');
            myBtn.textContent = (myBtn.textContent == 'Slett bildet')?
            'Gjenopprett bildet':'Slett bildet';
            const mySpan = document.getElementById('span_'+imgId);
            mySpan.textContent = (mySpan.textContent == imgName)?
            imgName + ' -slettes ved opplasting': imgName;

        });
        const img = document.createElement("img");
        img.src = url;
        img.id = imgId;
        img.className = "existing-image-preview";
        
        item.append(img, name, btn);
        existingImagesContainer.appendChild(item);
    });

    // Insert above the dropzone
    const dropzone = document.getElementById("form__post-task"); 
    dropzone.parentElement.insertBefore(existingImagesContainer, dropzone);
}
auth.onAuthStateChanged((user)=>{

                if (user) {
                  if (!currentTaskId) insertMap(null); 
                }
                else {
                    // User is not signed in
                    console.log("No user is signed in");
                    console.info(user);
                }

    });


  
 