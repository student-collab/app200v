import {auth} from './modules/dbConfig.js';

import {getUser, setTask} from './modules/FS_Requests.js'; 
import { getDroppedFiles, clearDroppedFiles } from './modules/postTask-fileDrop.js';
import { insertMap, getPinnedLoacationData } from './modules/insertGoogleMaps.js';

window.addEventListener('load', ()=>{

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

    let payload = {}; 
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
       
       payload ={
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
        console.log(JSON.stringify(payload));
        const docID = await setTask("", payload, imageFiles);
        console.info("Ferdig, ID:", docID);
        // Sletter intern fil-liste og tømmer den synlige fil-listen
        clearDroppedFiles(); 
        
    }
    
auth.onAuthStateChanged((user)=>{

                if (user) {
                    insertMap();
                }
                else {
                    // User is not signed in
                    console.log("No user is signed in");
                    console.info(user);
                }

    });


  
 