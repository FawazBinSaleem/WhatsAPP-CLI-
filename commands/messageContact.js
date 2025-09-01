const {
  askQuestion, confirm, requireNonEmpty, requireNumberInRange,
  maybeCreateMedia, sleep, printHeading, printList, log,
} = require('../utils');
const { getPersonalChats } = require('../getChats');

module.exports = async function messageContact(client, rl, showMainMenu) {
  const repeat = () => messageContact(client, rl, showMainMenu);
  const contacts = await getPersonalChats(client);

  if (contacts.length === 0) {
    console.log("No contacts found.");
    returnToMenuPrompt(rl, showMainMenu, client, repeat);
    return;
  }

  contacts.forEach((chat, i) => console.log(`${i + 1}. ${chat.name}`));

  const num = await askQuestion(rl, "\nSelect a contact by number: ");
  const index = parseInt(num) - 1;
  const selected = contacts[index];

  if (!selected) {
    console.log("Invalid selection.");
    returnToMenuPrompt(rl, showMainMenu, client, repeat);
    return;
  }

  const msg = await askQuestion(rl, `Enter message to send to ${selected.name}: `);
  await client.sendMessage(selected.id._serialized, msg);
  console.log("Message sent.");
  returnToMenuPrompt(rl, showMainMenu, client, repeat);
};
