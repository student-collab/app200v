import { getMockUser } from '../JS/modules/mockUser.js';
// importerer funksjonene som skal brukes
  import {getSavedTaskIds, getTask, createChat} from './modules/FS_Requests.js';
  import {auth, db} from './modules/dbConfig.js';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *  * * * * * * * * * * * * * * * * * *
 *    id blir sendt med i URL - for hver link i 'oppgavelisten.html' sendes                               *
 *    id med etter spørsmålstegn                                                                          *
 *    i URL: http://127.0.0.1:5500/pages/postedTaskDetail.html?id=08pCAxlL9X039IbK2egl                    *
 *                                                             ^^                                         *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *  * * * * * * * * * * * * * * * * * * */
  

  window.addEventListener('load' , ()=>{
  /* * * * * * * * * * * * * * * * * * * * * * * * * * * *
   *  Hvis det ikke er en id der blir brukeren           *
   *  sendt til oppgavelisten for å velge oppgave        *
   *  Ellers brukes ide til å hente en oppgave           *
   * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    
    // Leser id ut av URL-en
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        // Rediger 'other-page.html' til ønsket side
        window.location.href = '/pages/oppgaveliste.html';
        return; // Stans videre kjøring av koden
    }
    getTask(id).then((res)=>renderTask(res));
        
        console.log(id);
    });    
/* * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *  Hvis det ikke er en id der blir brukeren           *
 *  sendt til oppgavelisten for å velge oppgave.       *
 *  Samme hvis id ikke finnes i databasen.             *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
function renderTask(task) {
  if (!task){window.location.href = '/pages/oppgaveliste.html';}
  const app = document.getElementById("app");
  /* * * * * * * * * * * * * * * * * * * * * * * * * * * *
  *    Setter data fra databasen inn i HTML             *
  * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    const appInnerHTML =`
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
      <h4> by: ${task.createdBy?.displayName} </h4>
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
        <h3>ABOUT THIS TASK</h3>

        <p>${task.description}</p>
      </div>

      <div class="button-row">

        <button id ="save-task" class="saveTask-btn">❤️ Save task</button> 
        <button class="contact-btn">💬 Contact Poster</button> 
        
      </div>
      
      <div class="accept-btn">
      <button class="saveTask-btn">✅ Accept task</button>
      </div>
      
    

    </div>
  
  `;
  app.innerHTML = appInnerHTML;
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *    Legger til eventlistners på knapper som nå finnes  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const saveTask = document.getElementById("save-task");
saveTask.addEventListener('click', async ()=>{ 
  const user = getMockUser();
  
  const savedTaskIds = await getSavedTaskIds(user.uid);
  
  if (savedTaskIds.includes(task.id)){

    console.log("Brukeren har den allerede"); 

  }
  else{
  await db.collection('users').doc(user.uid).update({
              savedTaskIds: firebase.firestore.FieldValue.arrayUnion(task.id)
      });
  }


})

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
