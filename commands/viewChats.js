const { askQuestion, printHeading, printList, sleep, log } = require('../utils');
const { getPersonalChats, getGroupChats } = require('../getChats');

/**
 * Live chat viewer:
 * - Choose a chat (personal or group)
 * - Shows recent messages and keeps streaming new ones
 * - Commands inside viewer:
 *   /q            -> quit viewer
 *   /reply <text> -> reply to the chat
 *   /search <q>   -> search within loaded buffer
 */
async function viewChats(client, rl) {
  printHeading('Live chat viewer');

  const mode = (await askQuestion(rl, 'View (p)ersonal or (g)roup chats? ')).toLowerCase();
  const isGroup = mode === 'g';
  let page = 1;
  const pageSize = 20;

  let pageData = isGroup
    ? await getGroupChats(client, '', page, pageSize)
    : await getPersonalChats(client, '', page, pageSize);

  while (true) {
    const { data, total, totalPages } = pageData;
    if (data.length === 0) {
      console.log('No chats found.');
      return;
    }
    printList(data, (c) => `${c.name || c.formattedTitle}`);
    console.log(`Page ${pageData.page}/${totalPages} — ${total} results`);
    const sel = await askQuestion(rl, 'Enter # to pick, (n)ext, (p)rev, or (q)uit: ');
    if (sel === 'q') return;
    if (sel === 'n' && page < totalPages) { page += 1; pageData = isGroup ? await getGroupChats(client, '', page, pageSize) : await getPersonalChats(client, '', page, pageSize); continue; }
    if (sel === 'p' && page > 1) { page -= 1; pageData = isGroup ? await getGroupChats(client, '', page, pageSize) : await getPersonalChats(client, '', page, pageSize); continue; }

    const n = Number(sel);
    if (!Number.isInteger(n) || n < 1 || n > data.length) {
      console.log('Invalid selection.');
      continue;
    }
    const chat = data[n - 1];

    // Attach live listener
    printHeading(`Viewing: ${chat.name || chat.formattedTitle}`);
    const full = await client.getChatById(chat.id._serialized);

    // Load history
    try {
      const msgs = await full.fetchMessages({ limit: 25 });
      for (const m of msgs) {
        console.log(renderMessage(m));
      }
    } catch (err) {
      log.warn('Could not load history:', err.message);
    }

    let running = true;

    const onMessage = (msg) => {
      if (msg.from === chat.id._serialized || msg.to === chat.id._serialized || msg.id.remote === chat.id._serialized) {
        console.log(renderMessage(msg));
      }
    };

    client.on('message', onMessage);

    while (running) {
      const cmd = await askQuestion(rl, '> ');
      if (!cmd) continue;
      if (cmd === '/q') {
        running = false;
        break;
      } else if (cmd.startsWith('/reply ')) {
        const text = cmd.slice(7);
        try {
          await client.sendMessage(chat.id._serialized, text);
          log.info('Replied.');
        } catch (err) {
          log.warn('Failed to reply:', err.message);
        }
      } else if (cmd.startsWith('/search ')) {
        const q = cmd.slice(8).toLowerCase();
        try {
          const msgs = await full.fetchMessages({ limit: 100 });
          const hits = msgs.filter((m) => (m.body || '').toLowerCase().includes(q));
          console.log(`Found ${hits.length} messages containing "${q}":`);
          hits.forEach((m) => console.log(renderMessage(m)));
        } catch (err) {
          log.warn('Search failed:', err.message);
        }
      } else {
        console.log('Commands: /reply <text>, /search <q>, /q');
      }
      await sleep(10);
    }

    client.removeListener('message', onMessage);
    return; // after viewer exits, return to menu
  }
}

function renderMessage(m) {
  const ts = new Date(m.timestamp * 1000).toLocaleString();
  const from = m.fromMe ? 'You' : (m._data?.notifyName || m._data?.pushname || m.author || m.from);
  let label = `[${ts}] ${from}: `;
  if (m.hasMedia) {
    return `${label}<media> ${m.caption || ''}`;
  }
  return `${label}${m.body || ''}`;
}

module.exports = { viewChats };
