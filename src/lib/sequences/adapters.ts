import fs from "node:fs";
import type { ChannelAdapter } from "./types";

/** Dev adapter: logs each message. Real SMS/email providers (Twilio, SendGrid, ...) are a swap of this interface, not a dependency of the engine. */
export const consoleAdapter: ChannelAdapter = {
  send(message) {
    console.log(`[sequence:${message.channel}] to=${message.to} subject=${message.subject ?? ""} body=${message.body}`);
  },
};

/** Dev adapter: appends each message as a JSON line to a file, for inspection or tests. */
export function fileAdapter(filePath: string): ChannelAdapter {
  return {
    send(message) {
      fs.appendFileSync(filePath, JSON.stringify({ ...message, sentAt: new Date().toISOString() }) + "\n");
    },
  };
}
