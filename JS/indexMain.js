window.addEventListener ('load', ()=>{
    console.log("Loaded");
    document.addEventListener('click', (e) => {
        const clicked = e.target.closest('[data-role]'); 
        
        if (clicked?.dataset.role === 'login-trigger') {
            showLogin();
        } else if (!e.target.closest('[data-role="login-panel"]')) {
            hideLogin(); 
        }
    });


});

function showLogin(){
    const loginScreen = document.getElementById("login-screen");
    loginScreen.classList.toggle('hidden');
}

function hideLogin(){
    const loginScreen = document.getElementById("login-screen");
    loginScreen.classList.add('hidden');
}