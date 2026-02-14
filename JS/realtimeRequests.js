/**
 * Importerer funksjoner fra konfigurasjonsfilen
 */

import {  FIREBASECONFIG_DATABASEURL,
          tokenCache,
          hasValidToken,
          fetchToken
        } from './modules/dbConfig.js';

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
 * Funksjoner som skriver til databasen:
 *    #1 writeUserData - for registrering av brukere                                          -> kjører lokalt
 *    #2 dbWrite hjelpefunksjon for å gjøre overgang til writeRTdb letter                     -> kjører lokalt
 *    #3 writeRTdb - den eneste funksjonen med skrivetilgang uten: auth.signInAnonymously();  -> kjører på web
 * 
 ** ** ** ** ** ** ** */

export function writeUserData( brukerId, navn, psudoMail,group){    
            firebase.database().ref('brukere/' + brukerId).set({ 
              brukernavn : navn,
              psudoMail : psudoMail,
              createdTimestamp : new Date().toISOString(),
              usergroup: group
            });
    }
 //writeUserData( "008", "Mehmet Askercik", "mehmet.a@microsoft.ltd", "myFetchedgroup"); // test

 export function dbWrite (ref = 'forgottenREF/', payload, method = 'push', timeStamp = true){
  // Legger til tidstempel 
  if (timeStamp){payload.time = new Date().toISOString();}
  // SDK kall for skriving til database - om dette kallet brukes direkte blir det en mer arbeidsom overgang til 
  firebase.database().ref(ref)[method]( payload); 
}

// kjører på server - bruk token
export async function writeRTdb(ref = 'forgottenREF/', payload, method = 'push', timeStamp = true) {
    // Web-appen bruker SDK syntaks når den kjøres lokalt
  if (runningLocal){return dbWrite(ref, payload, method, timeStamp);}
    // Sjekker om service-token er gyldig i minst 10 sekunder til 
  if (!hasValidToken(10)){await fetchToken();}
    // Switch som 'oversetter så vi kan bruke SDK syntaks - med tanke på at vi skriver om funksjoner som har vært brukt under utviklingen.
      let httpMethod;
      switch (method) {
        case 'push':
          // Lager en ny under-node med unik nøkkelnavn:  tilsvarer SDK push --> firebase.database().ref('brukere/' + brukerId).push({  
          httpMethod = 'POST';   
          break;
        case 'update':
          // Oppdaterer noden, sletter oppføringer som blir satt til 0, lager nye oppføring hvis den ikke finnes - tilsvarer SDK update ---> firebase.database().ref('brukere/' + brukerId).update({ 
          httpMethod = 'PATCH';  
          break;
        case 'set':
        default:
          // Erstatter noden fullstendig - kan for eksempel slette alle brukere - tilsvarer SDK set ---> firebase.database().ref('brukere/' + brukerId).set({ 
          httpMethod = 'PUT';    
      }

      // Bygger URL med obligatorisk .json suffix)
      const url = `https://${FIREBASECONFIG_DATABASEURL}/${ref}.json`;
      // Legger til tidstempel
      if (timeStamp){ payload.time = new Date().toISOString();}
      // Utfører spørringen
      const resp = await fetch(url, {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenCache.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      // Sjekker om vellykket, prøver én ekstra gang hvis det gjelder autentisering: 401 Unauthorized og 403 Forbidden
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          // Sletter service-token - utløser innhenting av ny neste kjøring
          tokenCache.accessToken = null;
          // Kjører funksjonen på ny med samme argumenter som sist
          return writeRTdb(ref, payload, method);
        }
        const errBody = await resp.text();
        throw new Error(
          `Firebase write error ${resp.status} (${resp.statusText}): ${errBody}`
          // Vennligst kontakt systemansvarlig --
        );
      }

      //  Returnerer respons som JSON objekt
      return resp.json();
    }

  
  
/** ** ** ** 
 * 
 * Funksjoner som leser databasen:
 *    #1  readUserData 
 *    #2  readRTdb brukes på server - videresender til SDK-versjon ved lokal kjøring
 * 
 ** ** ** ** ** ** ** */

export async function readUserData(ref = 'forgottenREF/') { //om ref utelates lagres innholdet på noden forgottenREF 
  const dbRef = firebase.database().ref(ref); // SDK magic - tre linjer isedet for 30 
  const snapshot = await dbRef.once('value');
  return snapshot.val();   // null hvis noden ikke finnes
  
}

export async function readRTdb(ref = 'forgottenREF/') {
    // Web-appen bruker SDK syntaks når den kjøres lokalt
  if (runningLocal) {return readUserData(ref);} 
    // Sjekker om service-token er gyldig i minst 10 sekunder til 
  if (!hasValidToken(10)) {await fetchToken();}

    // URL settes sammen av adressen fra dbConfig (Google) + referanse til noden og obligatorisk ".json" suffix
  const url = `${FIREBASECONFIG_DATABASEURL}/${ref}.json`;

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${tokenCache.accessToken}`
    }
  });

    // Gjør ett ekstra forsøk ved 401 Unauthorized og 403 Forbidden
  if (!resp.ok) {
    if (resp.status === 401 || resp.status === 403) {
      tokenCache.accessToken = null;
      return readRTdb(ref);
    }
    const errBody = await resp.text();
    throw new Error(
      `Firebase read error ${resp.status} (${resp.statusText}): ${errBody}`
    );
  }

    // REST API (Google) returnerer et objekt med en "strøm" og (blant flere) en metode .json() som oversetter strømmen til JSON-objekt
  const dbData = await resp.json();
  //console.log('Data from Firebase:\n' + JSON.stringify(dbData, null, 2));
  return dbData;
}

/**
 * 
 * Kodeeksempler for realtimedatabase SDK
 * https://firebase.google.com/docs/database/web/read-and-write#web_3
 * 
 * Føl deg fri til å eksperimentere 
 * 
 * * * * * * * * * * * * */