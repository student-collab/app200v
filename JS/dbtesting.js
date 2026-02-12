

const WRITE_DB_BTN = document.getElementById("form_save_btn");
const READ_DB_BTN = document.getElementById("form_read_btn");
const INPUT_B_NAME = document.getElementById("bNavn");
const INPUT_E_MAIL = document.getElementById("psudoE-post");

WRITE_DB_BTN.addEventListener('click', (e) => {
e.preventDefault();
console.log("Save button");
let payload= {  "bname" :INPUT_B_NAME.value, 
                "email" :INPUT_E_MAIL.value
            };
console.log ("Brukernavn: " + payload.bname
            + "\nE-post: " + payload.email);

let ref = "/test"
method = 'set'

writeRTdb(ref, payload, method).then(wrote => {
    console.info(wrote);
    });
   
   
});

READ_DB_BTN.addEventListener('click', (e) => {
    e.preventDefault();
    console.log("Read button");
    
    
    
    
});
console.log("contains call to seeMe");
