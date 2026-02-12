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
