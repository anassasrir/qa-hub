#!/usr/bin/env tsx
import { sendSlackReport } from "./slackDashboardReport";

async function main() {
  try {
    await sendSlackReport();
    process.exit(0);
  } catch (err) {
    console.error("Échec de l'envoi Slack :", err);
    process.exit(1);
  }
}

main();
