async function getPersonalChats(client) {
  try {
    const chats = await client.getChats();
    return chats.filter((c) => !c.isGroup && c.name);
  } catch (err) {
    console.error("Error retrieving personal chats:", err);
    return [];
  }
}

async function getGroupChats(client) {
  try {
    const chats = await client.getChats();
    return chats.filter((c) => c.isGroup);
  } catch (err) {
    console.error("Error retrieving group chats:", err);
    return [];
  }
}

module.exports = {
  getPersonalChats,
  getGroupChats,
};
