 // Skriver til databasen - legger til brukere
    function writeUserData( brukerId, navn, psudoMail,timestamp,group){    
            firebase.database().ref('brukere/' + brukerId).set({ 
              brukernavn : navn,
              psudoMail : psudoMail,
              createdTimestamp : timestamp,
              usergroup: group
            
            });
    }
 
    const auth = firebase.auth();
    auth.signInAnonymously();

   writeUserData( "008", "Mehmet Askercik", "mehmet.a@microsoft.ltd", "myFetchedTimeAndDate", "myFetchedgroup");