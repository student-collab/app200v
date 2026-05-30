/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *  insertMap injisjerer script med API nøkkel som trigger callbak   *
 *  fra Google.                                                      *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
export function insertMap(location = null) {
    _editLocation = location;  // Hvis oppgave skal redigeres blir det lagret koordinater
    var MY_API_KEY = "AIzaSyB-CC4QtLrD-HD9_63IQFhNroyE8pnOOQY";
    const APILoader = document.createElement("script");
    APILoader.src = "https://maps.googleapis.com/maps/api/js?key=" +
     MY_API_KEY + 
     "&libraries=places&callback=initMap";
    document.head.appendChild(APILoader);

}
let pinnedLocationData = { kommune: "", longitude: 0, latitude: 0 };
export function getPinnedLoacationData(){ return pinnedLocationData}
let _editLocation = null; 

window.initMap = function() {
    // Define Norway's bounding box
    const norwayBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(57.96, 4.75),    // Southwest corner
        new google.maps.LatLng(71.19, 31.29)    // Northeast corner
    );

    const mapProp = {
        center: new google.maps.LatLng(59.3678,10.4438),  
        /* rundkjøringen ved USN Bakkenteigen 59.36784716115497 10.44389835143527 */
        /* Her burde vi absolutt bruke koordinater fra brukerprofilen */
        zoom: 10,
        restriction: {
            latLngBounds: norwayBounds,
            strictBounds: true
        }
    };
    const map = new google.maps.Map(document.getElementById("map-sidebar"), mapProp);
    const geocoder = new google.maps.Geocoder();
    const addressInput = document.getElementById("kommune");

    google.maps.event.addListener(map, 'click', function(event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        console.log('Clicked Coordinates:', lat, lng);
        placePin(lat, lng);
        reverseGeocode(lat, lng)
        .then(selectedLocation => fillForm(lat, lng, selectedLocation))
        .catch(error => console.error(error));
        
    });
    const autocomplete = new google.maps.places.Autocomplete(addressInput,
         {  componentRestrictions: { country: "no" },  // Norway only
            fields: ["geometry", "formatted_address", "address_components"]});
    
    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return; // User typed but didn't pick a suggestion

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        placePin(lat, lng);
        map.panTo({ lat, lng });

        const selectedLocation = {
            lat, lng,
            address: place.formatted_address,
            municipality: extractComponent(place.address_components, "administrative_area_level_2")
                    || extractComponent(place.address_components, "locality"),
            county: extractComponent(place.address_components, "administrative_area_level_1"),
        };
        fillForm(lat, lng, selectedLocation);
    });
    // Hvis det er redigering plasseres pinnen og lagret kommune skrives til adressefeltet 
    if (_editLocation?.latitude && _editLocation?.longitude) {
        const lat = _editLocation.latitude;
        const lng = _editLocation.longitude;
        placePin(lat, lng);
        map.panTo({ lat, lng });
        pinnedLocationData = { ..._editLocation };
        addressInput.value = _editLocation.kommune;
    }
    function fillForm(lat, lng, selectedLocation){
        const userLocation = (selectedLocation.address) ?? "";
        addressInput.value = userLocation + " " + selectedLocation.municipality + " kommune" ;
        pinnedLocationData.kommune = selectedLocation.municipality;
        pinnedLocationData.longitude = lng;
        pinnedLocationData.latitude = lat;
      
    }


    function placePin(lat, lng){
        if (window._taskMarker) window._taskMarker.setMap(null);
        window._taskMarker = new google.maps.Marker({
            position: { lat, lng },
            map
        });
    }
    function reverseGeocode(lat, lng) {
        return new Promise((resolve, reject) => {
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
    

}
