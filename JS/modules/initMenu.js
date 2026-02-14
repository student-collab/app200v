export function initMenu(){
    window.onload =()=>{
        const NAV_MENU = document.getElementById("navUL");
        const BURGER_BUTTON = document.getElementById("burger_button");
        const BURGER_CLOSE_IMG = document.getElementById("burger_close");
        const BURGER_BUTTON_IMG = document.getElementById("burger_stripes");
        
        NAV_MENU.classList.add("hidden");
        
        BURGER_BUTTON.onclick = (e) => {
                                            BURGER_CLOSE_IMG.classList.toggle("hidden");
                                            BURGER_BUTTON_IMG.classList.toggle("hidden");
                                            NAV_MENU.classList.toggle("hidden");
                                            NAV_MENU.classList.toggle("slide_in");
                                            
                                        }; 


    }
}