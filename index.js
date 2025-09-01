// index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const createQrServer = require('./qrserver');

// Utils
const {
  createInterface,
  printHeading,
  printList,
  askQuestion,
  log,
} = require('./utils');

// Menu + helpers
const { showMainMenu, registerActions } = require('./menu');
const { getPersonalChats, getGroupChats } = require('./getChats');

// Commands
const { messageContact } = require('./commands/messageContact');
const { messageGroup } = require('./commands/messageGroup');
const { messageParticipants } = require('./commands/messageParticipants');
const { viewChats } = require('./commands/viewChats');

async function initializeClient() {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'cli' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  const qrServer = createQrServer();

  // Only update the browser QR; no terminal QR
  client.on('qr', (qr) => {
    qrServer.updateQr(qr);
    printHeading('Scan the QR code at http://localhost:3000');
  });

  client.on('authenticated', () => {
    log.info('Authenticated with saved session. No QR needed next time.');
  });

  client.on('ready', () => {
    log.info('Client is ready.');
  });

  client.on('auth_failure', (m) => {
    log.error('Auth failure:', m);
  });

  client.on('disconnected', (r) => {
    log.warn('Client disconnected:', r);
    qrServer.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    try {
      log.info('Shutting down...');
      qrServer.close();
      await client.destroy();
    } catch (_) {}
    process.exit(0);
  });

  client.initialize();
  return client;
}

// --- The rest stays the same ---
async function listPersonalChats(client, rl) {
  printHeading('Personal chats');
  let page = 1, pageSize = 25;
  while (true) {
    const { data, total, totalPages } = await getPersonalChats(client, '', page, pageSize);
    printList(data, (c) => `${c.name || c.formattedTitle} — ${c.id._serialized}`);
    console.log(`Page ${page}/${totalPages} — ${total} results`);
    const cmd = await askQuestion(rl, '(n)ext, (p)rev, (q)uit: ');
    if (cmd === 'q') return;
    if (cmd === 'n' && page < totalPages) page++;
    else if (cmd === 'p' && page > 1) page--;
  }
}

async function listGroupChats(client, rl) {
  printHeading('Group chats');
  let page = 1, pageSize = 25;
  while (true) {
    const { data, total, totalPages } = await getGroupChats(client, '', page, pageSize);
    printList(data, (c) => `${c.name || c.formattedTitle} — ${c.id._serialized}`);
    console.log(`Page ${page}/${totalPages} — ${total} results`);
    const cmd = await askQuestion(rl, '(n)ext, (p)rev, (q)uit: ');
    if (cmd === 'q') return;
    if (cmd === 'n' && page < totalPages) page++;
    else if (cmd === 'p' && page > 1) page--;
  }
}

async function main() {
  const client = await initializeClient();
  const rl = createInterface();

  registerActions({
    viewChats,
    messageContact,
    messageGroup,
    messageParticipants,
    listPersonalChats,
    listGroupChats,
  });

  client.once('ready', async () => {
    await showMainMenu(client, rl);
  });
}

main().catch((err) => {
  log.error('Fatal:', err);
  process.exit(1);
});
