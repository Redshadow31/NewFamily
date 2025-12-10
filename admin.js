const jsonUrl = 'https://URL.DE.TON.JSON/users2.json'; // On changera ensuite

let users = [];

async function fetchUsers() {
  const res = await fetch(jsonUrl);
  users = await res.json();
  displayUsers();
}

function displayUsers() {
  const list = document.getElementById('userList');
  list.innerHTML = '';
  users.forEach((user, index) => {
    const li = document.createElement('li');
    li.innerHTML = `${user} <button onclick="removeUser(${index})">❌</button>`;
    list.appendChild(li);
  });
}

async function addUser() {
  const newUser = document.getElementById('user').value.trim().toLowerCase();
  if (!newUser) return;

  const res = await fetch("/.netlify/functions/updateUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add", user: newUser })
  });

  users = await res.json();
  displayUsers();
}

async function removeUser(index) {
  const user = users[index];
  const res = await fetch("/.netlify/functions/updateUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove", user })
  });

  users = await res.json();
  displayUsers();
}


fetchUsers();
