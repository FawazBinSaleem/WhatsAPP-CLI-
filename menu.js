// menu.js
let actions = {};

function registerActions(newActions) {
  actions = newActions;
}

function showMainMenu(client, rl) {
  console.log("\n--- Main Menu ---");
  console.log("1. Message a contact");
  console.log("2. Message a group");
  console.log("3. Message participants of a group");
  console.log("4. View personal chats");
  console.log("5. List personal chats");
  console.log("6. List group chats");
  console.log("0. Exit");

  rl.question("\nEnter your choice: ", async (choice) => {
    switch (choice.trim()) {
      case "1": return actions.messageContact(client, rl, showMainMenu);
      case "2": return actions.messageGroup(client, rl, showMainMenu);
      case "3": return actions.messageParticipants(client, rl, showMainMenu);
      case "4": return actions.viewChats(client, rl, showMainMenu);
      case "5": return actions.listPersonalChats(client, rl);
      case "6": return actions.listGroupChats(client, rl);
      case "0": rl.close(); break;
      default:
        console.log("Invalid choice.");
        showMainMenu(client, rl);
    }
  });
}

module.exports = { showMainMenu, registerActions };
