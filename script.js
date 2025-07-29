const clientId = 'rr75kdousbzbp8qfjy0xtppwpljuke';
const token = '4dac4j69keeckddjaqp5617uenbav6';

async function fetchUserLists() {
    const [res1, res2] = await Promise.all([
        fetch('users1.json'),
        fetch('users2.json')
    ]);
    const users1 = await res1.json();
    const users2 = await res2.json();
    return [...users1, ...users2];
}

async function fetchStreams(logins) {
    const query = logins.map(user => `user_login=${user}`).join('&');
    const url = `https://api.twitch.tv/helix/streams?${query}`;
    const response = await fetch(url, {
        headers: {
            'Client-ID': 'rr75kdousbzbp8qfjy0xtppwpljuke',
            'Authorization': `Bearer ${4dac4j69keeckddjaqp5617uenbav6}`
        }
    });
    return response.json();
}

async function init() {
    const allUsers = await fetchUserLists();

    const chunks = [allUsers.slice(0, 100), allUsers.slice(100)];
    const onlineUsers = [];

    for (const group of chunks) {
        const data = await fetchStreams(group);
        onlineUsers.push(...data.data);
    }

    const liveContainer = document.getElementById('live-users');
    const offlineContainer = document.getElementById('offline-users');
    const onlineLogins = onlineUsers.map(user => user.user_login.toLowerCase());

    for (const user of allUsers) {
        const isOnline = onlineLogins.includes(user.toLowerCase());
        const data = onlineUsers.find(u => u.user_login.toLowerCase() === user.toLowerCase());
        const card = document.createElement('div');
        card.classList.add('user-card');
        if (!isOnline) card.classList.add('offline');

        const link = `https://twitch.tv/${user}`;
        const title = isOnline ? data.title : 'Hors ligne';
        const img = isOnline
            ? data.thumbnail_url.replace('{width}', '320').replace('{height}', '180')
            : 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png';

        card.innerHTML = `
            <a href="${link}" target="_blank">
                <img src="${img}" alt="Preview">
                <div class="username">${user}</div>
                <div class="title">${title}</div>
            </a>
        `;

        if (isOnline) {
            liveContainer.appendChild(card);
        } else {
            offlineContainer.appendChild(card);
        }
    }
}

init();
