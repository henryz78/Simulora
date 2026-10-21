// Sends one plain-text email over SMTP with TLS (Gmail with an app password by default). No library: the few
// commands a single message needs. The login is read from a file on the server and never logged.
import { readFileSync } from "node:fs";
import { connect } from "node:tls";

export type SendMail = (to: string, subject: string, text: string) => Promise<void>;

const b64 = (text: string) => Buffer.from(text, "utf8").toString("base64");

/** Reads "address\npassword" from `file`; the address is also the sender. */
export function smtpMailer(file: string, host = "smtp.gmail.com", port = 465, name = "Simulora"): SendMail {
  // An app password is shown in groups of four; the spaces are not part of it.
  const [user = "", pass = ""] = readFileSync(file, "utf8").split(/\r?\n/).map((line) => line.replace(/\s/g, ""));
  if (!user.includes("@") || !pass) throw new Error(`${file}: expected the address on line 1, the password on line 2`);
  return async (to, subject, text) => {
    if (/[\r\n<>]/.test(to)) throw new Error("Bad recipient");
    const socket = connect({ host, port, servername: host });
    socket.setEncoding("utf8");
    socket.setTimeout(30_000, () => socket.destroy(new Error("SMTP timed out")));
    let buffer = "";
    const waiting: ((line: string) => void)[] = [];
    socket.on("data", (chunk: string) => {
      buffer += chunk;
      // A reply ends with a line whose code is followed by a space ("250 OK"); "250-..." lines continue it.
      let end: RegExpExecArray | null;
      while ((end = /^\d{3} .*\r?\n/m.exec(buffer))) {
        const reply = buffer.slice(0, end.index + end[0].length);
        buffer = buffer.slice(reply.length);
        waiting.shift()?.(reply);
      }
    });
    const closed = new Promise<never>((_, reject) => {
      socket.on("error", reject);
      socket.on("close", () => reject(new Error("SMTP connection closed")));
    });
    const reply = () => Promise.race([new Promise<string>((done) => waiting.push(done)), closed]);
    const step = async (command: string | null, expect: string) => {
      const answer = reply();
      if (command !== null) socket.write(`${command}\r\n`);
      const line = await answer;
      // The server's words, without our command: a password never reaches an error message or a log.
      if (!line.startsWith(expect)) throw new Error(`SMTP refused: ${line.trim().split("\n").pop()?.slice(0, 120)}`);
    };
    try {
      await step(null, "220");
      await step("EHLO simulora", "250");
      await step("AUTH LOGIN", "334");
      await step(b64(user), "334");
      await step(b64(pass), "235");
      await step(`MAIL FROM:<${user}>`, "250");
      await step(`RCPT TO:<${to}>`, "250");
      await step("DATA", "354");
      const message = [
        `From: =?UTF-8?B?${b64(name)}?= <${user}>`,
        `To: <${to}>`,
        `Subject: =?UTF-8?B?${b64(subject)}?=`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${crypto.randomUUID()}@${user.split("@")[1]}>`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=utf-8",
        "Content-Transfer-Encoding: base64",
        "",
        // Base64 lines never start with a dot, so the body needs no escaping.
        ...(b64(text).match(/.{1,76}/g) ?? []),
        ".",
      ].join("\r\n");
      await step(message, "250");
      socket.write("QUIT\r\n");
    } finally {
      socket.end();
    }
  };
}
