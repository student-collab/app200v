// Handles dynamic content for userProfile.html. Needs to be simplified and optimized, but it works for now.

// DOM elements
const myProfile = document.getElementById('myProfile');
const myTasks = document.getElementById('myTasks');
const myReviews = document.getElementById('myReviews');
const savedTasks = document.getElementById('savedTasks');
//const messages = document.getElementById('messages');
const paymentMethods = document.getElementById('paymentMethods');
//const notifications = document.getElementById('notifications');
const userInfo = document.getElementById('userInfo');

const profileSubheader = document.getElementById('profileSubheader');
const subheaderTitle = document.getElementById('subheaderTitle');
const subheaderIcon = document.getElementById('subheaderIcon');

let buttons = [];

// All section panels that can be opened from profile navigation.
const sections = [myTasks, myReviews, savedTasks, paymentMethods];

// Only allow subheader click to navigate back when we are in section mode.
function onSubheaderClick() {
  if (profileSubheader.classList.contains('is-back')) {
    showProfile();
  }
}

// Reset subheader to default profile state (title + gear icon + no back behavior).
function setSubheaderAsProfile() {
  subheaderTitle.textContent = 'My Profile';
  subheaderIcon.innerHTML = '&#9881';
  profileSubheader.classList.remove('is-back');
}

// Turn subheader into a back control and show the current section title.
function setSubheaderAsBackButton(title) {
  subheaderTitle.textContent = title;
  subheaderIcon.textContent = '←';
  profileSubheader.classList.add('is-back');
}


// Shared section display logic: hide everything else, show selected section, update subheader.
function showSection(section, title) {
  sections.forEach(view => {
    view.style.display = 'none';
  });

  buttons.forEach(btn => {
    btn.style.display = 'none';
  });

  userInfo.style.display = 'none';
  section.style.display = 'block';
  setSubheaderAsBackButton(title);
}





document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
  //IDs for all profile action buttons in the HTML.
  const buttonIds = [
    "myTasksBtn",
    "myReviewsBtn",
    "savedTasksBtn",
    "paymentMethodsBtn"
  
  ];

  //Convert IDs into real DOM button elements and ignore missing ones.
  buttons = buttonIds.map(id => document.getElementById(id)).filter(Boolean);

  //Map each button ID to the function that should run when it is clicked.
  const buttonActions = {
    myTasksBtn: showTasks,
    myReviewsBtn: showReviews,
    savedTasksBtn: showSavedTasks,
    paymentMethodsBtn: showPaymentMethods
  };

  //Attach the correct click handler to each existing button.
  buttonIds.forEach(id => {
    const btn = document.getElementById(id);
    const action = buttonActions[id];
    if (btn && action) {
      btn.addEventListener('click', action);
    }
  });

  if (profileSubheader) {
    profileSubheader.addEventListener('click', onSubheaderClick);
  }

  // Hide legacy in-section back buttons since subheader now handles back behavior.
  document.querySelectorAll('.backBtn').forEach(btn => {
    btn.style.display = 'none';
  });

}

//Function to show tasks section
function showTasks() {
  showSection(myTasks, 'My Tasks');
}

//Function to show reviews section
function showReviews() {
  showSection(myReviews, 'My Reviews');
}


function showSavedTasks() {
  showSection(savedTasks, 'Saved Tasks');
}


function showPaymentMethods() {
  showSection(paymentMethods, 'Payment Methods');
}


//Function to show profile section
function showProfile() {
    sections.forEach(view => {
    view.style.display = 'none';
  });
    userInfo.style.display = 'block';

    buttons.forEach(btn => {
    btn.style.display = 'flex';
  });

  setSubheaderAsProfile();
}