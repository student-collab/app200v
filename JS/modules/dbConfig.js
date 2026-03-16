/**
 *  Realtime database er en del av Firebase som er et av Googles mange produkter
 *  2 minutters intro: https://youtu.be/U5aeM5dvUpA
 * 
 *  Av hensyn til web-hosten, hvis billigste alternativ ikke tillater Node.js. 
 *  Og med hensyn til samarbeidet og innleveringen, har vi valgt å bruke namespace API som innebærer at 
 *  koden for å opprette en instans av Firebase SDK lenkes inn fra eksterne kilder heller enn
 *  å installere pakker og pakkemanager. 
 * 
 *  For å gjøre kommunikasjonen med databasen så enkel som mulig, ved å benytte SDK, lenker vi inn eksterne script
 *  i alle HTML-dokumnetene hvor vi har behov for å kommunisere med databasen: 
 * 
 *   <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
 *
 *  Fra scriptene opprettes instanser av Firebase Software Development Kit (SDK)
 * 
 */

/**
 * 
 *  Konfigurasjonen er ikke hemmelig, kreves for å opprette en instans som kan 
 *  kommunisere med Google (Firebase Realtime database)
 * 
 */

const firebaseConfig = {
  apiKey: "AIzaSyB6gctvGImGYdx3inuoCnO2AloPUq7UTkc",
  authDomain: "app200v-team11.firebaseapp.com",
  databaseURL: "https://app200v-team11-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "app200v-team11",
  storageBucket: "app200v-team11.firebasestorage.app",
  messagingSenderId: "968082910252",
  appId: "1:968082910252:web:2d9b6149c77b2781f0f589"
};
export const FIREBASECONFIG_DATABASEURL = firebaseConfig.databaseURL;
/**
 *  Her opprettes instanser av forskjellige moduler, deler av Googles Firebase SDK 
 *  De gir tilgang til forskjellige instanser som har metoder vi trenger
 *  Her: basis, database og tilgangskontroll
 * 
 */
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const db = firebase.firestore();       // Firestore
const auth = firebase.auth();

/**
 *  Denne metoden er en bakdør - den tillater anonym innlogging. 
 *  Hvem som helst i den store verden som kopierer konfigurasjonen ovenfor 
 *  kan logge inn slik vi selv gjør og få de samme tilgangene vi har bevilget oss selv.
 *  - under utviklingen av webapplikasjonen er det en helt grei løsning,
 *  Da finnes det ikke viktige data i databasen, og vi kan gjenskape struktur fra backup.
 * 
 *  Denne bakdøren er aktivert og kan deaktiveres på Google konsollen - databasens GUI
 *  Spør Rooney om tilgang ved behov
 * 
 */
auth.signInAnonymously();

/**
 *  Servicetoken er den rikitge måten å autetisere oss på
 * 
 *  tokenCache er oppbevaringsplass for (service-)token.
 *  Nettversjonen av web-applikasjonen vi lager bruker token for hver HTTP forespørsel
 *  En token generes på web-host ved hjelp av JSON-service-nøkkel og kommunikasjon med Google.
 *  
 + + + + +  Spesielt interesserte kan se filen get-token.php + + + + +
 * 
 *  Service-token er gyldig i maksimum én time.
 *  Token lagres i tokenCache sammen med utløpstiden, og skiftes dersom tiden for 
 *  forespørselen er senere enn utløpstiden, ikke ellers. 
 *  Google har begrensinger på antall tildelinger.
 * 
 */

export const tokenCache = {
  accessToken: null,
  expiresAt: 0
};


/**
 * 
 *  hasValidToken er en hjelpefunksjon som kjøres i forkant av hver forespørsel 
 *  fra serveren vår (webhost) til Google (Firebase Realtime Database)
 *  Den kontrollerer om token vi har lagret i tokenCache fortsatt er gyldig
 * 
 * 
 */

export function hasValidToken(bufferSec = 10) {
  const now = Date.now();                 // ms since epoch
  const minValid = now + bufferSec * 1000; // ms
  return tokenCache.accessToken && tokenCache.expiresAt > minValid;
}

/**
 * 
 *  fetchToken kjører scriptet get-token.php på serveren for å kommunisere med Google og 
 *  få en ny fersk service-token i retur. På vår web-host, utenfor området som er tilgjengelig
 *  for web, finnes en service-JSON-nøkkelfil. Den er tilgjengelig for php-scriptet siden det kjøres
 *  lokalt på serveren. Kjøres på samme maskin som nøkkelfilen er lagret. 
 * 
 */
//Her brukes path - bør defineres heller enn å skrives direkte:
// Nå brukes get-token fra root
// Rikitg path: 
/*
$rawTPath = __DIR__ . '/../../../webroots/r1434796/FireBaseRTdb_JSON_key';
$TokP = realpath($rawTPath);
define('TOKEN_CACHE_FILE', $TokP . '/token_cache.json');
*/
// Jeg vil ha den path-en fra php ... 

// Endringer :
// Bruker mm.php heller enn direkte kall
   export async function fetchToken() {
    try {
    
        const response = await fetch('/mm.php', {
            method: 'GET',
           // credentials: 'same-origin',   // same-origin er default-verdi. omit sender ikke auth/cookies include sender til 'alle'
            headers: {'X-Internal-Secret': 'www-w3schools-com-jsref-prop_doc_cookie-asp'}
        });
        
        if (!response.ok) {
            throw new Error(`Server responded ${response.status} (${response.statusText})`);
        }

        // ----- Parse JSON (will throw if body is not JSON) -----
        const data = await response.json();

        // ----- Payload‑level check (our contract) -----
        if (!data.success) {
            throw new Error(`Backend error: ${data.error || 'unknown'}`);
        }

        tokenCache.accessToken = data.access_token;
        tokenCache.expiresAt = data.expiresAt;

    } catch (err) {
        // Handles:
        //   • Network failures
        //   • Non‑2xx HTTP responses
        //   • Invalid JSON
        //   • Backend‑reported errors
        console.log(err.message);
        
    }
}




// module.js
// export function myFunction() {
  // code here

// main.js
//import { myFunction } from './module.js';
//myFunction();
