const {
  askQuestion, confirm, requireNumberInRange, requireNonEmpty,
  maybeCreateMedia, sleep, printHeading, printList, log,
} = require('../utils');
const { getGroupChats } = require('../getChats');

async function messageParticipants(client, rl) {
  printHeading('DM each participant in a group');

  // Pick group
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
      const groupChat = data[n - 1];

      // Load participants
      const full = await client.getChatById(groupChat.id._serialized);
      const participants = full?.participants || [];
      if (!participants.length) {
        console.log('No participants found.');
        return;
      }

      printHeading(`Participants in ${groupChat.name || groupChat.formattedTitle}`);
      printList(participants, (p) => `${p.id.user}${p.isAdmin ? ' (admin)' : ''}${p.isSuperAdmin ? ' (owner)' : ''}`);
      console.log(`Total: ${participants.length}`);

      const excludeAdminsAns = await askQuestion(rl, 'Exclude admins? (y/N): ');
      const excludeAdmins = ['y', 'yes'].includes((excludeAdminsAns || '').toLowerCase());

      const text = requireNonEmpty(await askQuestion(rl, 'Message text: '), 'message text');
      const maybeMediaPath = await askQuestion(rl, 'Media file path (optional): ');
      const media = await maybeCreateMedia(client, maybeMediaPath || null);

      const toSend = participants.filter((p) => !(excludeAdmins && (p.isAdmin || p.isSuperAdmin)));
      console.log(`\nAbout to DM ${toSend.length}/${participants.length} participants.`);
      const ok = await confirm(rl, 'Proceed? (y/N): ');
      if (!ok) {
        console.log('Cancelled.');
        return;
      }

      for (const p of toSend) {
        try {
          const chatId = p.id._serialized;
          await sleep(600 + Math.floor(Math.random() * 700)); // rate limit
          await client.sendMessage(chatId, media ? media : text, media ? { caption: text } : {});
          log.info('Sent to', chatId);
        } catch (err) {
          log.warn('Failed to send to a participant:', err.message);
        }
      }

      log.info('Finished messaging participants.');
      return;
    } catch (err) {
      log.warn(err.message);
    }
  }
}

module.exports = { messageParticipants };
