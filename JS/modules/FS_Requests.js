/**
 * Beskjeder som ikke trenger vær med i innleveringen, underveiskommunikasjon mer 
 * enn dokumentasjon. Skriver på norsk 
 * 
 */

/*  ------------------------------------------------------------------------------------------
        Eksempelfunskjoner som viser hvordan vi kan lese, sette, oppdatere og slette
    ------------------------------------------------------------------------------------------
*/

// For å kommunisere med databasen via SDK importerer vi databaseobjektet fra konfig-filen dbConfig.js
import { db, storage} from './dbConfig.js'; 

// db er et objekt returnert av SDK. SDK System Development Kit er lenket inn med HTML. Denne løsningen kalles Compat (?) og er fra Content Delivery Network (CDN)


/*
            Hvis dere skal ut finne informasjon på nettet, for eksempel dokumentasjon fra Google
            Så må dere vite dette: 

            Compat (CDN)
            Loaded via a <script> tag from Google's CDN — no install, no bundler, no node_modules. Available globally in the browser immediately.

            Modular (npm)
            Installed via npm install firebase, used in a bundled project (React, Vite, etc.).

            Vi bruker Compat (CDN) og her er forskjellen i kode-eksempel:
            Modular (npm)	await setDoc(doc(db, 'tasks', taskId), data)	Separate arguments or template string
            Compat (CDN)	await db.doc('tasks/taskId').set(data)	Template string or chained methods
            
            Mye informasjon på nettet er rettet mot Modular, som ikke vil virke hos oss
            Dette gjelder selvfølgelig også dersom dere bruker AI: dere får riktig syntaks om dere presiserer at det er for Compat CDN

    Dette er funksjonene vi bruker fra Compat (CDN): (Tilgjengelig i når db importeres fra dbConfig.js --> import { db } from './dbConfig.js';)

    await db.doc(`tasks/${taskId}`).set(data);
    await db.doc(`tasks/${taskId}`).update(changes);
    await db.doc(`tasks/${taskId}`).delete();
    await db.doc(`tasks/${taskId}`).update({ fieldName: firebase.firestore.FieldValue.delete() });

Nedenfor er det generert hjelpefunksjoner som vi kan bruke ved å importere dem

import-syntaks: 
                    import {getTask,
                            setTask,
                            updateTask,
                            deleteTask,
                            clearField,
                            readFSdb        
                    } from './FS_Requests.js'; 

*/

/* Kartlegger oppdrag per kommune */


/*
        Froklaring av syntaks for returveriden: 
                                                        .map() is just the standard JS array method — nothing Firestore-specific.

                                                        The callback d => ({ id: d.id, ...d.data() }) runs for each snapshot d:

                                                        d.id — the document's Firestore ID (string)
                                                        d.data() — returns the document's fields as a plain JS object
                                                        ...d.data() — spreads those fields into the new object
                                                        id: d.id — adds the ID as an explicit field (since .data() doesn't include it)
*/



async function getTask(taskId = "") {
    if(taskId == ""){
        console.log("getTask without taskId");
        const querySnapshot = await db.collection('tasks').get();
        
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
    }
    else{
      console.log("taskId = " + taskId);

          const snap = await db.collection('tasks').doc(taskId).get();
          if (!snap.exists) return null;
          return { id: snap.id, ...snap.data() };
        }
  }

  async function uploadImage(file, taskId) {
    const storageRef = storage.ref(`tasks/${taskId}/${Date.now()}_${file.name}`);
    const snapshot = await storageRef.put(file);
    return snapshot.ref.getDownloadURL();
}

async function setTask(taskId, data, imageFiles = []) {

  let resolvedId = taskId;
  if (taskId !== "") {
    await db.collection('tasks').doc(taskId).set(data);
  } else {
     const docRef = await db.collection('tasks').add(data);
    resolvedId = docRef.id;
  }

  if (imageFiles.length > 0) {
    const urls = await Promise.all(
      imageFiles.map(file => uploadImage(file, resolvedId))
    );

    await db.collection('tasks').doc(resolvedId).update({
      images: urls
    });
  }

  return resolvedId;
}

  async function updateTask(taskId, changes) {
    await db.collection('tasks').doc(taskId).update(changes);
  }

  async function deleteTask(taskId) {
    await db.collection('tasks').doc(taskId).delete();
  }

  async function clearField(taskId, fieldName) {
    await db.collection('tasks').doc(taskId).update({
      [fieldName]: firebase.firestore.FieldValue.delete()
    });
  }




export async function readFSdb(path = 'collection/document') {
  
  const segments = path.split('/').filter(Boolean);

  // Odd segments = document, even = collection
  if (segments.length % 2 === 1) {
   const snap = await db.collection(path).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } else {
    const snap = await db.doc(path).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }
}

export { getTask, setTask, updateTask, deleteTask, clearField};

//Oppretter eller oppdaterer en bruker i 'users' collection i Firestore
export async function setUser(userId, data) { //userId= Firebase Authenticator ID
                                              //data = objektet med ting man vil lagre

  await db.collection('users').doc(userId).set(data, { merge: true }); //merge gjør at vi ikke sletter eksisterende data. //set skriver data til firestore
}

/**
 * 
 *          Senere - query 
 * 
 * * * * * * * * * * * * * * 
 *
 *        Full example
 * 
            const q = query(
            collection(db, 'tasks'),
            where('status', '==', 'active'),
            where('priority', '>=', 2),
            orderBy('dueDate', 'asc'),
            limit(20)
            );

            const snap = await getDocs(q);
 *
 *
 * * * * * * * * * * * * * * * * * * * * * */

/*
await getDocs(query(collection(db, 'tasks'), where('status', '==', 'active')));

where('status', '==', 'active')      // equals
where('priority', '!=', 'low')       // not equals
where('count', '<', 10)              // less than
where('count', '<=', 10)             // less than or equal
where('count', '>', 5)               // greater than
where('count', '>=', 5)              // greater than or equal

where('tags', 'array-contains', 'urgent')     // contains value in array
where('tags', 'array-contains-any', ['urgent', 'important'])  // any of these
where('category', 'in', ['work', 'personal']) // field matches any in list

query(
  collection(db, 'tasks'),
  where('status', '==', 'active'),
  where('priority', '>', 3),
  orderBy('dueDate', 'asc'),
  limit(10)
)

orderBy('dueDate', 'asc')   // sort ascending
orderBy('dueDate', 'desc')  // sort descending
limit(10)                   // limit results
startAfter(lastDoc)         // pagination
startAt(value)              // start from value
endAt(value)                // end at value


*/