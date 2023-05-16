import { App } from "@slack/bolt";
import axios from "axios";
import cron from "node-cron";
import { config as dotenv, } from 'dotenv';

dotenv();

const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
});

interface ManagersResponseData {
  rukovoditel: string;
  sotrudniki: object;
}

interface UserResponseData {
  name: string;
  email: string;
  birthday: string;
}


/**
 * Function to resolve users objects to an array
 * @param users - Array of users
 */
function resolveUsersList(users: object): UserResponseData[] {
  return Object.values(users);
}

/**
 * Format an array of users to birthday reminder string.
 * @param users - Array of users
 */
function prepareBirthdayReminder(users: UserResponseData[]): string {
  return users.map((user) => `@${user.name} - ${user.birthday}`).join(' ');
}

cron.schedule('0 09 * * *', async () => {
  const response = await axios.post(process.env.MOCK_API_URL)
  const managerArray = response.data as ManagersResponseData[];
  managerArray.forEach( async (row) => {
    const userToNotify = await app.client.users.lookupByEmail({email: row.rukovoditel});
    const workerList = resolveUsersList(row.sotrudniki);
    const textToSend = prepareBirthdayReminder(workerList);
    app.client.chat.postMessage({
      channel: userToNotify.user.id,
      text: textToSend,
    });
    console.log(`${row.rukovoditel} - reminders sent`);
  })
});

app.start().catch((error) => {
  console.error(error);
  process.exit(1);
});