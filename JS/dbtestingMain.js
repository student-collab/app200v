



import {
    showResp
} from './modules/showRead.js';

import { getTask,
        setTask,
        updateTask,
        deleteTask,
        clearField,
        readFSdb        
} from './modules/FS_Requests.js'; 

function myfunction(){
    if (1){
        getTask();
        setTask();
        updateTask();
        deleteTask();
        clearField();
        readFSdb();
    }
}
const FORM = document.getElementById("test_form");
const WRITE_DB_BTN = document.getElementById("form_save_btn");
const READ_DB_BTN = document.getElementById("form_read_btn");
const INPUT_TASK_TITLE = document.getElementById("t_title");
const INPUT_TASK_DESCRIPTION = document.getElementById("t_descript");
const INPUT_REQUISITE_1 = document.getElementById("requisites1");
const INPUT_REQUISITE_2 = document.getElementById("requisites2");


let tag1 = (INPUT_REQUISITE_1.checked) ?  INPUT_REQUISITE_1.value : "";
let tag2 = (INPUT_REQUISITE_2.checked) ?  INPUT_REQUISITE_2.value : "";
/* Se etter og ikke tillat innsending av tomt skjema ...  */

WRITE_DB_BTN.addEventListener('click', async (e) => {
 if (!FORM.checkValidity()) {
    FORM.reportValidity(); 
    return; // Stop execution
  }
console.log("Save button clicked - gathering payload");
let payload = { 
    description     :INPUT_TASK_DESCRIPTION.value,
    title           :INPUT_TASK_TITLE.value,
    status          : "open",
meta                : {     created: Date.now(),
                            tags: [tag1, tag2]
                        },
assignee           : {  uid: 'abc123',
                        name: 'Rooney' },
location            : { "conty"         : "Vestfold",
                                        "mucipality"    : "Horten",
                                        "longditude"    : 59.414410, 
                                        "latitude"      : 10.472876
                    }
    };

console.info (payload);

let docID = await setTask(0,payload);
console.info ("Sent");
console.info ("ID: " + docID);
/*
  myTask = {    
        title: "Hjelp til bortkjøring av søppel",
        status: "open",
        meta: {
            created: Date.now(),
            tags: ['krever førerkort', 'bil']
        },
        assignee: {
            uid: 'abc123',
            name: 'Rooney'
        }
        "location" : { "conty"         : "Vestfold",
                                        "mucipality"    : "Horten",
                                        "longditude"    : 59.414410, 
                                        "latitude"      : 10.472876
        }
}
  
  
*/

});

READ_DB_BTN.addEventListener('click', async (e) => {
    console.log("Read button ");
    let myData = await getTask();
    console.info(myData);
    showResp(myData);
    
/*
let db = readRTdb ("brukere/");
    db.then(db =>{showResp(db)});
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
