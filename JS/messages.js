document.getElementById('sendBtn').addEventListener('click', async () => {

  const input = document.getElementById('messageInput');

  await sendMessage("abc123", {
    text: input.value,
    senderId: auth.currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
});