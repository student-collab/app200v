import {auth} from './modules/dbConfig.js';
auth.onAuthStateChanged((user)=>{

                if (user) {
                    insertMap();
                    //insertForm();
                    //insertUser(user);
                    //document.getElementById("createTask").classList.remove("hidden");
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
        return;
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

                const display = document.getElementById("location-display");
                if (display) display.textContent = selectedLocation.municipality;

                resolve(selectedLocation); // ← Return the data here
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
        const latInput = document.getElementById("lat");
        const lngInput = document.getElementById("lng");
        const tidInput = document.getElementById("tid");

        const timestamp = Date.now(); //millisekunder siden Unix-epoch
        const readableTimestamp = new Date(timestamp).toString();
        kommuneInput.value = selectedLocation.municipality;
        latInput.value = lat;
        lngInput.value = lng;
        tidInput.value = readableTimestamp;
      
    }
    

}
