
import { initMenu } from './modules/initMenu.js';
initMenu(); // Loads menu
import {    dbWrite,
            writeRTdb,
            writeUserData,
            readUserData,
            readRTdb
        } from './realtimeRequests.js';


import {
    showResp
} from './modules/showRead.js';

const WRITE_DB_BTN = document.getElementById("form_save_btn");
const READ_DB_BTN = document.getElementById("form_read_btn");
const INPUT_B_NAME = document.getElementById("bNavn");
const INPUT_E_MAIL = document.getElementById("psudoE-post");

WRITE_DB_BTN.addEventListener('click', (e) => {
e.preventDefault();
console.log("Save button");
let payload = {  "bname" :INPUT_B_NAME.value, 
                "email" :INPUT_E_MAIL.value
            };
console.log ("Brukernavn: " + payload.bname
            + "\nE-post: " + payload.email);

let ref = "brukere/"
let method = 'push' // kan være: push / update / set 

//writeRTdb(ref, payload, method).then(wrote => { // endringsvennlig
//   console.info(wrote);
//});
let id = "008";
let navn = "James Bond";
let psudomail = "J@bond";
let gruppe = "arbeider";
writeUserData(id,navn,psudomail,gruppe);


});

READ_DB_BTN.addEventListener('click', (e) => {
    e.preventDefault();
    console.log("Read button - testmodus, leser ikke");
    let db = readRTdb ("brukere/");
    db.then(db =>{showResp(db)});
/*
 let db = {
    "brukere": {    "008" : {   "navn" : "James Bond",
                                "psudomail" : "J@bond",
                                "gruppe" : "arbeider"
                            }
                }
 }
 
 showResp(db);
    
  */  
    
    
});
