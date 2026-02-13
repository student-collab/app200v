/**
 * Importerer funksjoner fra konfigurasjonsfilen
 */

import {  FIREBASECONFIG_DATABASEURL,
          tokenCache,
          hasValidToken,
          fetchToken
        } from './dbConfig.js';

/**
 * 
 *  Finner ut om web-applikasjonen kjører eller på server
 *  Kjøring lokalt bruker anonym autentisering -- auth.signInAnonymously();
 *  Kjøring fra server bruker service-token for autentisering
 * 
 */

let runtimeEnvironment = false;
if (  window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname === '[::1]') {
      runtimeEnvironment = true;
      console.log('Running on localhost');
  } 
const runningLocal = runtimeEnvironment;

/** ** ** ** 
 * 
 * Funksjoner som skriver til databasen
 * 
 ** ** ** ** ** ** ** */


// kjører lokalt - anonym autentisering 
    function writeUserData( brukerId, navn, psudoMail,timestamp,group){    
            firebase.database().ref('brukere/' + brukerId).set({ 
              brukernavn : navn,
              psudoMail : psudoMail,
              createdTimestamp : timestamp,
              usergroup: group
            
            });
    }
 //writeUserData( "008", "Mehmet Askercik", "mehmet.a@microsoft.ltd", "myFetchedTimeAndDate", "myFetchedgroup");


// kjører på server - bruk token
async function writeRTdb(ref = 'forgottenREF/', payload, method = 'set', timeStamp = true) {
  if (runningLocal){
    writeUserData(ref, payload, method, timeStamp);
    return;
  }
  if (!hasValidToken(10)){await fetchToken();}
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
      const url = `https://${FIREBASECONFIG_DATABASEURL}/${ref}.json`;
      // Adding the timeStamp
      if (timeStamp){
        payload.time = new Date().toISOString();;
        
      }
      // Perform the request
      const resp = await fetch(url, {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenCache.accessToken}`
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
          // Vennligst kontakt systemansvarlig
        );
      }

      //  Return the parsed JSON response (usually the stored value)
      return resp.json();
    }

  
  
/** ** ** ** 
 * 
 * Funksjoner som leser databasen
 * 
 ** ** ** ** ** ** ** */

async function readRTdb (ref = 'brukere/'){
  if (runningLocal){
  // videresend forespørsel til writeUserData - som ikke burde hete det
    return;
  }

  if (!hasValidToken(10)){await fetchToken();}

  const dbPath = ref; 
  const url = `https://${FIREBASECONFIG_DATABASEURL}/${dbPath}.json`;
  const dbResp = await fetch(url, {
      method: 'GET',
      headers: {  'Accept': 'application/json',
                  'Authorization': `Bearer ${tokenCache.accessToken}`
               }
  });

  if (!dbResp.ok) {
      throw new Error(`Firebase returned ${dbResp.status} (${dbResp.statusText})`);
  }

  const dbData = await dbResp.json();
  //console.log('Data from Firebase:\n' + JSON.stringify(dbData, null, 2));
  return dbData;

}
