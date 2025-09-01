const {
  askQuestion, confirm, requireNonEmpty, requireNumberInRange,
  maybeCreateMedia, sleep, printHeading, printList, log,
} = require('../utils');
const { getGroupChats } = require('../getChats');

async function messageGroup(client, rl) {
  printHeading('Message a group');

  // Search and paginate
  const q = await askQuestion(rl, 'Search group name (optional): ');
  const pageSize = 20;
  let page = 1;

  let pageData = await getGroupChats(client, q, page, pageSize);
  while (true) {
    const { data, total, totalPages } = pageData;
    if (data.length === 0) {
      console.log('No groups found.');
      return;
    }
    printList(data, (c) => `${c.name || c.formattedTitle}`);
    console.log(`Page ${pageData.page}/${totalPages} — ${total} results`);
    const sel = await askQuestion(rl, 'Enter # to pick, (n)ext, (p)rev, or (q)uit: ');
    if (sel === 'q') return;
    if (sel === 'n' && page < totalPages) { page += 1; pageData = await getGroupChats(client, q, page, pageSize); continue; }
    if (sel === 'p' && page > 1) { page -= 1; pageData = await getGroupChats(client, q, page, pageSize); continue; }

    try {
      const n = requireNumberInRange(sel, 1, data.length, 'selection');
      const chat = data[n - 1];
      const text = requireNonEmpty(await askQuestion(rl, 'Message text: '), 'message text');

      const maybeMediaPath = await askQuestion(rl, 'Media file path (optional): ');
      const media = await maybeCreateMedia(client, maybeMediaPath || null);

      console.log(`\nAbout to send to group: ${chat.name || chat.formattedTitle} (${chat.id._serialized})`);
      console.log(`Text: ${text}`);
      if (media) console.log(`Media: yes (${maybeMediaPath})`);
      const ok = await confirm(rl, 'Send to this group? (y/N): ');
      if (!ok) {
        console.log('Cancelled.');
        return;
      }

      // Typing indicator (best-effort)
      try { await chat.sendStateTyping(); } catch (_) {}
      await sleep(800);

      await client.sendMessage(chat.id._serialized, media ? media : text, media ? { caption: text } : {});
      try { await chat.clearState(); } catch (_) {}

      log.info('Message sent to group.');
      return;
    } catch (err) {
      log.warn(err.message);
    }
  }
}

module.exports = { messageGroup };
