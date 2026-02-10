 // Skriver til databasen - legger til brukere
    function writeUserData( brukerId, navn, psudoMail,timestamp,group){    
            firebase.database().ref('brukere/' + brukerId).set({ 
              brukernavn : navn,
              psudoMail : psudoMail,
              createdTimestamp : timestamp,
              usergroup: group
            
            });
    }
 


   writeUserData( "008", "Mehmet Askercik", "mehmet.a@microsoft.ltd", "myFetchedTimeAndDate", "myFetchedgroup");