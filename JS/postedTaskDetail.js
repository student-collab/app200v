
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
          
          renderTask(res);
    });
        
        console.log(id);
    });    


function renderTask(task) {

  const app = document.getElementById("app");

  app.innerHTML = `
  
        <a class="header-link" href="oppgaveliste.html">
     <div class="header">   
          <h2>← ${task.title}</h2>    
     </div>
     </a>

    <div class="container">

      <div class="image-box">
       <img src="${task.images}" alt="Task image">
      </div>

      <div class="title-row">
        <h1>${task.title}</h1>
        <div class="rating">
          ⭐ ${task.rating}
        </div>
        
      </div>

      <div class="creator-row">
      <h4> by: ${task.creatorId} </h4>
      </div>

      
      <div class="tags">
        <span class="tag">
          📍 ${task.location.kommune}
        </span>

        <span class="tag">
          🏷 ${task.category}
        </span>

        <span class="tag price">
          ${task.pris} kr
        </span>
      </div>

      <div class="status">
        ${task.status}
      </div>

      

      <div class="section">
        <h3>Task Description</h3>

        <p>${task.description}</p>
      </div>

      
     <button class="saveTask-btn">❤️ Save task</button>
      
    <button class="contact-btn">💬 Contact Poster</button>

    </div>
  
  `;
}