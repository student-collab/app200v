
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
    if (!id) {
        // Rediger 'other-page.html' til ønsket side
        window.location.href = '/pages/oppgaveliste.html';
        return; // Stans videre kjøring av koden
    }
    getTask(id).then((res)=>{ 
          const show = document.getElementById('temp-show');
          const dataString =  JSON.stringify(res,null,2);
          //show.textContent = dataString.replace(/,\n/g, '\n').replace(/,\s*(?=\])/g, '\n');;
          
          renderTask(res);
    });
        
        console.log(id);
    });    

/*
{
"id":"s0npiQ5uDwNHGhRMMWN2",
"meta":{  "created":{ "seconds":1779533150,
                      "nanoseconds":34000000
                    },
          "tags":["inspection","electrical"]
        },
"assignee":{  "ePost":"",
              "uid":""
            },
"title":"Replace windows",
"rating":6,
"category":"Annet",
"images":["https://firebasestorage.googleapis.com/v0/b/app200v-team11.firebasestorage.app/o/deer54x54.png?alt=media&token=60f2af4e-ca14-4b97-a218-12e424919be0"],
"createdBy":{ "ePost":"haruto.silva6@gmail.com",
              "uid":"0P3jGGgGxXlBv3OjgUgp"
              "diplayName": "Haruto A" 
            },
"description":"Preventive maintenance",
"pris":8400,
"status":"open",
"urgent":false,
"location":{  "latitude":59.275996358855956,
              "kommune":"Tønsberg sentrum",
              "longitude":10.418037575238904
            },
}
HERE

{ "id":"S9IoZ6jTJ51NXN66ltLd",
  "category":"IT & Teknikk",
  "title":"Clean gutters",
  "rating":5,
  "description":"Urgent maintenance needed",
  "createdBy":{ "ePost":"hassan.wisniewski11@protonmail.com",
                "displayName":{ "last":"Wiśniewski",
                                "display":"Hassan W.",
                                "first":"Hassan"
                              },
                "uid":"ucMoGcXDFpGDCnDi2qIs"
              },
  "meta":{  "created":{ "seconds":1779904812,
                        "nanoseconds":13000000
                      },
            "tags":["plumbing"]
          },
  "pris":2700,
  "assignee":{  "ePost":"",
                "uid":""
              },
  "images":["https://firebasestorage.googleapis.com/v0/b/app200v-team11.firebasestorage.app/o/white-taskFeed.png?alt=media&token=83f96899-c370-4bf1-9cc1-f441996d783d"],
  "urgent":false,
  "status":"open",
  "location":{  "kommune":"Eik",
                "latitude":59.26784751304342,
                "longitude":10.44675867244244
              }
  }
*/
function renderTask(task) {
console.log(JSON.stringify(task));
  const app = document.getElementById("app");
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
  app.innerHTML = appInnerHTML;
const saveTask = document.getElementById("saveTask-btn");
console.info(saveTask);
saveTask.addEventListener('click', ()=>{ console.log("Klikk")})

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
