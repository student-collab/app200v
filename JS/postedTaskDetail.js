
// importerer funksjonene som skal brukes
  import {getTask, createChat} from './modules/FS_Requests.js';
  import {auth} from './modules/dbConfig.js';


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
          //show.textContent = dataString.replace(/,\n/g, '\n').replace(/,\s*(?=\])/g, '\n');;
          
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
      <h4> by: ${task.createdBy?.uid} </h4>
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

      <div class="button-row">

        <button class="saveTask-btn">❤️ Save task</button> 
        <button class="contact-btn">💬 Contact Poster</button> 
        
      </div>
      
      <div class="accept-btn">
      <button class="saveTask-btn">✅ Accept task</button>
      </div>
      
    

    </div>
  
  `;

  //Creates a chat with between the logged in user and the poster of the task
  const contactBtn = document.querySelector('.contact-btn');
  contactBtn?.addEventListener('click', async () => {
    const currentUserId = auth.currentUser?.uid;
    const posterId = task?.createdBy?.uid || task?.creatorId;

    if (!currentUserId || !posterId || currentUserId === posterId) return;

    const participants = [currentUserId, posterId];
    const chatId = [...participants].sort().join('_');

    await createChat(chatId, participants);
    window.location.href = `./messagesChat.html?chatId=${encodeURIComponent(chatId)}`;
  });
}
