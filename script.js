
const clientId = 'rr75kdousbzbp8qfjy0xtppwpljuke';
const token = '4dac4j69keeckddjaqp5617uenbav6';
const users1 = ["firewolf151o", "fardezaltv", "bluevitae", "ketziya_thewitch", "treymoneyxv", "itz_yorezapi", "dinox_qc", "miserymtv", "nesquiik_s", "mirror_monarch", "simon_le7", "d3ad_lord_", "linvincible6", "nayzox49", "eiraam__", "kolomiso_twitch", "hellgate80", "gribfris31", "xeronorex", "bobman49100", "missprissou96", "rogue_stapler", "princessenuria_54", "patrick_patoix", "jooblack__", "waxteztv", "sethtv1", "roronoa12_", "xloucs_off", "saratatineqc", "panpinette_", "minnienala30", "renaud092", "snoopyange87", "reylen_art", "theboss974hd", "enzoleyoyo_", "lephilosophe21", "sergentwolf69", "al4stortv", "siynlive", "naaash137", "mstr_koala", "totoni112", "denivak", "roisephiboo", "kidoyuto92", "mat_le_suisse_gaming", "djokuma", "leberzerk", "tv_ragnarm", "acemendosa", "leoloiseau_12", "ghostboartv", "noxmower", "lirawave", "rebelle_7ds", "siryubux", "kiuzuuu", "kikilebandit19", "leviacarpe", "mohaa_leplan", "lespydyverse", "blackenedforall", "hastune_mikumiku", "lelgamingandstreaming", "cuda_6000", "sheeveraa", "corba404", "abdellex2_2", "draponch", "onclesmarius", "natalys47", "h2_narvalo", "etoras56", "tania2507", "clisandru", "ssparrooh", "anyak_29", "vanderwaaldorf", "sebdaries", "demondskull", "sallyruby", "lawra_tv", "seykasuxkyas83", "dramazzz_", "leprofesseurx", "tsukilamoon", "lyxo8z", "maximusqclive", "mika17330", "moon_alonzo", "ugogoal", "vektor_live", "zhineko", "saijou__", "ixxzarakiixxi", "zelephs"]; // à remplir avec les 100 premiers pseudos
const users2 = ["missinkdaddy", "daddygrizzi", "alexnocauf", "gagini_", "legeek61230", "jogamerss", "eryseia", "scor__pion4", "fouinaxx", "la_filledu14", "knuckygp", "yuhy_kirso", "mr_fragile", "mogkaw", "sigurdson64", "mmesigurdson64", "exiziagaming", "djoshhh_", "maya_error", "nnotyi", "yotox47", "nexou31", "clarastonewall", "red_shadow_31", "thedark_sand", "selena_akemi", "altheatroy", "furizaxboi", "dylow95", "n0name_x_", "rubbycrea", "benzzootv", "mizu_energia", "livio_on", "misslyliee", "canardpuma_76", "yaya_romali", "jenny31200", "darkip0tt3r", "jalnna76", "kalyshin", "thony1384", "lafeecachecouille", "saikossama", "p_ghostface", "mahyurah", "corbinks", "lilbaabs", "nemsb2b", "mousskeykong", "pierrotofficiel", "tabs_up", "xr4ven_38", "kakarotto_9191", "loulangegaming", "xlsaladin", "bete_feroce", "lilbutterfly444", "leth_88", "poseidon_117", "shakoune_senpai_tv", "zyrenstv", "onizuka2734", "emilysims76", "xxappleslayerxx", "maxroronoa22", "gorkaliam", "lawsilvers", "mcfly_59140", "hades92111516", "gilbert_hime", "mcaliena", "stormlight___"]; // à remplir avec les suivants

const allUsers = [...users1, ...users2];

async function fetchStreams(logins) {
    const query = logins.map(user => `user_login=${user}`).join('&');
    const url = `https://api.twitch.tv/helix/streams?${query}`;
    const response = await fetch(url, {
        headers: {
            'Client-ID': rr75kdousbzbp8qfjy0xtppwpljuke,
            'Authorization': `Bearer ${4dac4j69keeckddjaqp5617uenbav6n}`
        }
    });
    return response.json();
}

async function init() {
    const chunks = [allUsers.slice(0, 100), allUsers.slice(100)];
    const onlineUsers = [];
    for (const group of chunks) {
        const data = await fetchStreams(group);
        onlineUsers.push(...data.data);
    }

    const liveContainer = document.getElementById('live-users');
    const offlineContainer = document.getElementById('offline-users');

    const onlineLogins = onlineUsers.map(user => user.user_login);

    for (const user of allUsers) {
        const isOnline = onlineLogins.includes(user);
        const data = onlineUsers.find(u => u.user_login === user);
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
