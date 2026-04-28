import {auth} from './modules/dbConfig.js';

import {setTask} from './modules/FS_Requests.js'; 


window.addEventListener('load', ()=>{
    /* ----------- post-task-knappen ---------------------------- */
    const submitButton = document.getElementById("btn-post-task");
    submitButton.addEventListener('click',async ()=> postingTask());
    /* ----------- tøm-skjema-ikonet ---------------------------- */
    const clearPostTaskForm = document.getElementById("clear-form");
    const postTaskForm = document.getElementById("form__post-task");
    clearPostTaskForm.addEventListener('click',()=>postTaskForm.reset());
    
})

async function postingTask (){
    console.log("submit");
        const FORM = document.getElementById('form__post-task');
        if (!FORM.checkValidity()) {
            FORM.reportValidity(); 
            return; // Stopper hvis skjema ikke er fylt
        }
        const valgtPris = document.getElementById("viser-pris");
        payload.pris = valgtPris.value;
  
        const imageFiles = window.getDroppedFiles(); // your existing API
        const newTaskId = await setTask(0, taskData, imageFiles);
        
        
        //let docID = await setTask(0,payload);
        console.info ("Sent");
        console.info ("ID: " + docID);


}
let payload = { 
                    title           :"",
                    description     :"",
                    status          : "open",
                    pris            :"",
                    meta            : {     created: "",
                                            tags: ['tag1', 'tag2']
                                        },
                    assignee        : {  uid:"" ,
                                        ePost: "" },
                    location        : { "kommune"       : "",
                                        "longitude"    : "", 
                                        "latitude"      : ""
                                    }
                    };

auth.onAuthStateChanged((user)=>{

                if (user) {
                    insertMap();
                    insertUser(user);
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
function insertUser(user){
   
      
      payload.assignee.ePost = user.email;
      payload.assignee.uid = user.uid;
    
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
        payload.location.latitude = lat;
        payload.location.longitude = lng;
        
      
    }
    

}
/*
export function getPayload() {
  return payload;
}
  */