import {auth} from './modules/dbConfig.js';

import {getUser, setTask} from './modules/FS_Requests.js'; 
import { getDroppedFiles, clearDroppedFiles } from './modules/postTask-fileDrop.js';

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

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * 
     * 
     * 
     * 
     * 
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


    let payload = {}; 
async function postingTask (){
/* * * * * * * * * * * * * * * * * * *
 *  Sjekker at alle felt er utfylt   *
 * * * * * * * * * * * * * * * * * * */
        const FORM = document.getElementById('form__post-task');
        if (!FORM.checkValidity()) {
            FORM.reportValidity(); 
            return; // Stopper hvis skjema ikke er fylt
        }
/* * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *  Henter brukerens id, avbryter hvis ikke funnet     *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        const user = auth.currentUser;
        if (!user) return;
        payload.createdBy = { uid: user.uid, ePost: user.email };

/* * * * * * * * * * * * * * * * * * * * * * * * *
 *  Definering av payload, objekt for sending    *
 * * * * * * * * * * * * * * * * * * * * * * * * */

payload ={
        title: "", description: "", status: "open", pris: 0,
        category:"",
        meta: {},
        assignee: { uid: "", ePost: "" },
        createdBy: { uid: "", ePost: "" },
        location: { kommune: "", longitude: 0, latitude: 0 },
        urgent: false,
        images: []
    };
/* * * * * * * * * * * * * * * * * * * *
 *  Manuell innsamling av formdata     *
 * * * * * * * * * * * * * * * * * * * */
        const valgtPris = document.getElementById("viser-pris").value;
        payload.pris = Number(valgtPris);
        payload.title       = document.getElementById("task-title").value;
        payload.description = document.getElementById("beskrivelse").value;
        payload.category    = document.getElementById("kategori").value;
        payload.urgent      = document.getElementById("urg-toggle-btn").checked;
        payload.location.address = "not storing adress - rather the coordinates";
        payload.meta.created = firebase.firestore.FieldValue.serverTimestamp();
        payload.meta.tags    = [];
  
        const imageFiles = getDroppedFiles(); // postTask-fileDrop.js 
/* * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *  Opplasting til Firebase, skjer i FS_requests.js    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
        docID = await setTask("", payload, imageFiles);
        console.info("Ferdig, ID:", docID);
        // Sletter intern fil-liste og tømmer den synlige fil-listen
        clearDroppedFiles(); 
        
    }
    
    
/* Alt som har med kart kan flyttes ut  */
/*

Det er ikke ønskelig med kart på oppretting av profil.
Hvi kartet kun brukes når brukeren post en task...
Da kan den være en modul knyttet inn her med import. 

Hvis den skal brukes flere steder bør den være standalone 

Spøsrmål: Skal jeg linke den inn i HTML 

*/
auth.onAuthStateChanged((user)=>{

                if (user) {
                    insertMap();
                    payload.assignee.ePost = user.email;
                    payload.assignee.uid = user.uid;
                }
                else {
                    // User is not signed in
                    console.log("No user is signed in");
                    console.info(user);
                }

    });

    
function insertMap() {
    var MY_API_KEY = "AIzaSyB-CC4QtLrD-HD9_63IQFhNroyE8pnOOQY";
    const APILoader = document.createElement("script");
    APILoader.src = "https://maps.googleapis.com/maps/api/js?key=" + MY_API_KEY + "&callback=initMap";
    document.head.appendChild(APILoader);

}


  
window.initMap = function() {
    // Define Norway's bounding box
    const norwayBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(57.96, 4.75),    // Southwest corner
        new google.maps.LatLng(71.19, 31.29)    // Northeast corner
    );

    const mapProp = {
        center: new google.maps.LatLng(59.3678,10.4438),  
        /* rundkjøringen ved USN Bakkenteigen 59.36784716115497 10.44389835143527 */
        zoom: 10,
        restriction: {
            latLngBounds: norwayBounds,
            strictBounds: true
        }
    };
    const map = new google.maps.Map(document.getElementById("map-sidebar"), mapProp);
    const geocoder = new google.maps.Geocoder();

    google.maps.event.addListener(map, 'click', function(event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        console.log('Clicked Coordinates:', lat, lng);
        placePin(lat, lng);
        reverseGeocode(lat, lng)
        .then(selectedLocation => fillForm(lat, lng, selectedLocation))
        .catch(error => console.error(error));
        
    });

    
    function placePin(lat, lng){
    console.log("placePin");
    if (window._taskMarker) window._taskMarker.setMap(null);
    window._taskMarker = new google.maps.Marker({
        position: { lat, lng },
        map,
    });
    }
    function reverseGeocode(lat, lng) {
        return new Promise((resolve, reject) => {
            console.log("reverseGeocode");
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status !== "OK" || !results) {
                    console.error("Reverse geocode failed:", status);
                    reject(new Error("Reverse geocode failed: " + status));
                    return;
                }
                const components = results[0].address_components;
                
                let selectedLocation = {
                    lat,
                    lng,
                    address: results[0].formatted_address,
                    municipality: extractComponent(components, "administrative_area_level_2")
                                || extractComponent(components, "locality")
                                || extractComponent(components, "administrative_area_level_1"),
                    county: extractComponent(components, "administrative_area_level_1"),
                };



                resolve(selectedLocation); 
            });
        });
    }
    function extractComponent(components, type) {
                    const match = components.find((c) => c.types.includes(type));
                    return match ? match.long_name : null;
                }
    function fillForm(lat, lng, selectedLocation){
        console.info(selectedLocation);
        console.log("lat: " + lat + " lng: " + lng);

        const kommuneInput = document.getElementById("kommune");
        const userLocation = (selectedLocation.address) ?? "";
        kommuneInput.value = userLocation + " " + selectedLocation.municipality + " kommune" ;
        payload.location.kommune = selectedLocation.municipality;
        payload.location.latitude = lat;
        payload.location.longitude = lng;
        
      
    }
    

}

/*
export function getPayload() {
  return payload;
}
  */
 