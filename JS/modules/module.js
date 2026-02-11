/* 
    Denne lagrer data i en 'privat' database: Realtime Database fra Google Firebase
    https://app200v-team11-default-rtdb.europe-west1.firebasedatabase.app/
    gratis tjeneste fra Google lenke til 2 minutters intro:
    https://youtu.be/U5aeM5dvUpA

  
    Bruker disse i alle HTML-dokumnetene som skal interagere med databasen:
    -- Eksterne script som gjør det mulig å kommunisere med Realtime Database fra Google Firebase --
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>

    -- Intern script som inneholder det som må til for å etablere forbindelsen --
    <script type="module" src="./JS/modules/module.js"></script> 

    -- Internt skript for å skrive ting til databasen mest for å ha et eksempel å se på --
    <script type="module" src="./JS/writeRTDB.js"></script> 
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

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const auth = firebase.auth();
auth.signInAnonymously();

const tokenCache = {
  /** The raw OAuth token string will be stored here*/
  accessToken: null,
  expiresAt: 0
};

   async function fetchToken() {
    try {
    
        const response = await fetch('/get-token.php', {
            method: 'GET',
            credentials: 'same-origin'   // send cookies if you need auth later
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
        tokenCache.expiresAt = data.expires_in;

    } catch (err) {
        // Handles:
        //   • Network failures
        //   • Non‑2xx HTTP responses
        //   • Invalid JSON
        //   • Backend‑reported errors
        console.log(err.message);
    }
}




function hasValidToken(bufferSec = 10) {
  const now = Date.now();                 // ms since epoch
  const minValid = now + bufferSec * 1000; // ms
  return tokenCache.accessToken && tokenCache.expiresAt > minValid;
}

async function readRTdb (ref = '/'){
  if (!hasValidToken(10)){await fetchToken();}

  const dbPath       = ref; // the node you want to read
  const firebaseUrl = `https://${firebaseConfig.databaseURL}/${dbPath}?auth=${encodeURIComponent(tokenCache.accessToken)}`;
  //                   "https://app200v-team11-default-rtdb.europe-west1.firebasedatabase.app" 

  const dbResp = await fetch(firebaseUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
  });

  if (!dbResp.ok) {
      throw new Error(`Firebase returned ${dbResp.status} (${dbResp.statusText})`);
  }

  const dbData = await dbResp.json();
  //log('Data from Firebase:\n' + JSON.stringify(dbData, null, 2));
  return dbData;

}

async function writeRTdb (){
if (!hasValidToken(10)){await fetchToken();}

//  firebaseConfig.databaseURL: "https://app200v-team11-default-rtdb.europe-west1.firebasedatabase.app",

  //const FIREBASE_HOST = 'app200v-team11-default-rtdb.europe-west1.firebasedatabase.app';
}


 async function writeRTdb(ref = '/', payload, method = 'set') {
      // Choose HTTP verb based on the desired operation
      let httpMethod;
      switch (method) {
        case 'push':
          httpMethod = 'POST';   // creates a new child with a unique key
          break;
        case 'update':
          httpMethod = 'PATCH';  // merges the supplied fields
          break;
        case 'set':
        default:
          httpMethod = 'PUT';    // replaces the node entirely
      }

      // Build the URL (notice the mandatory .json suffix)
      const url = `https://${firebaseConfig.databaseURL}/${ref}.json?auth=${encodeURIComponent(
        tokenCache.accessToken
      )}`;

      // Perform the request
      const resp = await fetch(url, {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Handle HTTP errors – retry once on auth failures
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          // Token probably expired between the cache check and the request.
          // Invalidate the cache and try once more.
          tokenCache.accessToken = null;
          return writeRTdb(ref, payload, method);
        }
        const errBody = await resp.text();
        throw new Error(
          `Firebase write error ${resp.status} (${resp.statusText}): ${errBody}`
        );
      }

      //  Return the parsed JSON response (usually the stored value)
      return resp.json();
    }

    //document.getElementById('saveBtn').addEventListener('click', async () => {});
  