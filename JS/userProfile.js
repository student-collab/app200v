// Handles dynamic content for userProfile.html. Needs to be simplified and optimized, but it works for now.

// DOM elements
const myProfile = document.getElementById('myProfile');
const myTasks = document.getElementById('myTasks');
const myTasksBtn = document.getElementById('myTasksBtn');
const myReviews = document.getElementById('myReviews');
const myReviewsBtn = document.getElementById('myReviewsBtn');
const savedTasks = document.getElementById('savedTasks');
const savedTasksBtn = document.getElementById('savedTasksBtn');
const messages = document.getElementById('messages');
const messagesBtn = document.getElementById('messagesBtn');
const paymentMethods = document.getElementById('paymentMethods');
const paymentMethodsBtn = document.getElementById('paymentMethodsBtn');
const notifications = document.getElementById('notifications');
const notificationsBtn = document.getElementById('notificationsBtn');


// Function to show tasks section
function showTasks() {
    myTasksBtn.style.display = 'none';
    myReviewsBtn.style.display = 'none';
    savedTasksBtn.style.display = 'none';
    messagesBtn.style.display = 'none';
    paymentMethodsBtn.style.display = 'none';
    notificationsBtn.style.display = 'none';
    myTasks.style.display = 'block';
}

// Function to show reviews section
function showReviews() {
    myTasksBtn.style.display = 'none';
    myReviewsBtn.style.display = 'none';
    savedTasksBtn.style.display = 'none';
    messagesBtn.style.display = 'none';
    paymentMethodsBtn.style.display = 'none';
    notificationsBtn.style.display = 'none';
    myReviews.style.display = 'block';
}

// Function to show saved tasks section
function showSavedTasks() {
    myTasksBtn.style.display = 'none';
    myReviewsBtn.style.display = 'none';
    savedTasksBtn.style.display = 'none';
    messagesBtn.style.display = 'none';
    paymentMethodsBtn.style.display = 'none';
    notificationsBtn.style.display = 'none';
    savedTasks.style.display = 'block';
}

// Function to show messages section
function showMessages() {
    myTasksBtn.style.display = 'none';
    myReviewsBtn.style.display = 'none';
    savedTasksBtn.style.display = 'none';
    messagesBtn.style.display = 'none';
    paymentMethodsBtn.style.display = 'none';
    notificationsBtn.style.display = 'none';
    messages.style.display = 'block';
}

// Function to show payment methods section
function showPaymentMethods() {
    myTasksBtn.style.display = 'none';
    myReviewsBtn.style.display = 'none';
    savedTasksBtn.style.display = 'none';
    messagesBtn.style.display = 'none';
    paymentMethodsBtn.style.display = 'none';
    notificationsBtn.style.display = 'none';
    paymentMethods.style.display = 'block';
}

// Function to show notifications section
function showNotifications() {
    myTasksBtn.style.display = 'none';
    myReviewsBtn.style.display = 'none';
    savedTasksBtn.style.display = 'none';
    messagesBtn.style.display = 'none';
    paymentMethodsBtn.style.display = 'none';
    notificationsBtn.style.display = 'none';
    notifications.style.display = 'block';
}

// Function to show profile section
function showProfile() {
    myTasks.style.display = 'none';
    myTasksBtn.style.display = 'flex';
    myReviews.style.display = 'none';
    myReviewsBtn.style.display = 'flex';
    savedTasks.style.display = 'none';
    savedTasksBtn.style.display = 'flex';
    messages.style.display = 'none';
    messagesBtn.style.display = 'flex';
    paymentMethods.style.display = 'none';
    paymentMethodsBtn.style.display = 'flex';
    notifications.style.display = 'none';
    notificationsBtn.style.display = 'flex';
}

// Event listeners
myTasksBtn.addEventListener('click', showTasks);
myReviewsBtn.addEventListener('click', showReviews);
savedTasksBtn.addEventListener('click', showSavedTasks);
messagesBtn.addEventListener('click', showMessages);
paymentMethodsBtn.addEventListener('click', showPaymentMethods);
notificationsBtn.addEventListener('click', showNotifications);

// Attach showProfile to all back buttons. This way, we don't need to create a unique back button for all sections
document.querySelectorAll('.backBtn').forEach(btn => {
    btn.addEventListener('click', showProfile);
});