
// importerer funksjonen som skal brukes
  import {getTask} from './modules/FS_Requests.js';


  /*
      id blir sendt med i URL - for hver link i 'oppgavelisten.html' sendes
      id med etter spørsmålstegn 
      i URL: http://127.0.0.1:5500/pages/postedTaskDetail.html?id=08pCAxlL9X039IbK2egl

  */

  window.addEventListener('load' , ()=>{
    // Leser id ut av URL-en
    const id = new URLSearchParams(window.location.search).get('id');
    getTask(id).then((res)=>{ 
          const show = document.getElementById('temp-show');
          const dataString =  JSON.stringify(res,null,2);
          show.textContent = dataString.replace(/,\n/g, '\n').replace(/,\s*(?=\])/g, '\n');;
          
    });
        
        console.log(id);
    });    