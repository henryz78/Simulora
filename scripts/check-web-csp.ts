// IP-9.9: the production web build must render under its own Content Security
// Policy. The journey suite runs against the dev server, which cannot carry a
// strict CSP, so this loads the built nginx container and fails on any violation.
import { chromium } from "@playwright/test";

const url = process.env.SIMULORA_WEB_URL ?? "http://127.0.0.1:8080/";
const response = await fetch(url);
const policy = response.headers.get("content-security-policy") ?? "";
for (const directive of ["default-src 'self'", "script-src 'self'", "frame-ancestors 'none'"]) {
  if (!policy.includes(directive)) throw new Error(`Missing CSP directive: ${directive}`);
}
if (response.headers.get("referrer-policy") !== "no-referrer") {
  throw new Error("Referrer-Policy must be no-referrer");
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) violations.push(message.text());
  });
  await page.goto(url, { waitUntil: "networkidle" });
  const rendered = await page.locator("#root *").count();
  if (!rendered) throw new Error("The production build rendered nothing under its CSP");
  if (violations.length) throw new Error(`CSP violations: ${violations.join(" | ")}`);
  console.log(`Production web build renders under CSP (${rendered} elements)`);
} finally {
  await browser.close();
}
