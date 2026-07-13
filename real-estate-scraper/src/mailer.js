import nodemailer from 'nodemailer';
import { EMAIL, CRITERIA } from './config.js';

function money(n) {
  return n == null ? '?' : `$${Math.round(n).toLocaleString()}`;
}

function formatListing(l) {
  const price =
    l.category === 'lease'
      ? `${money(l.price)}${l.price_unit === 'sqft_yr' ? '/sf/yr' : '/mo'}`
      : money(l.price);
  const sqft = l.sqft ? `${Math.round(l.sqft).toLocaleString()} sf` : 'sqft unknown';
  const kitchen = l.kitchen_equipped === 'yes' ? 'kitchen equipment mentioned' : 'kitchen status unknown';
  return `- [${l.title}](${l.url})\n  ${price} · ${sqft} · ${kitchen} · source: ${l.source}${l.address ? ` · ${l.address}` : ''}`;
}

export function buildDigest(newListings, failedSources) {
  const lease = newListings.filter((l) => l.category === 'lease');
  const business = newListings.filter((l) => l.category === 'business_for_sale');

  const lines = [];
  lines.push(`${newListings.length} new listing(s) matching your cafe/food-space search (Portland metro).`);
  lines.push(
    `Budget: lease <= ~${money(CRITERIA.leaseBudgetMonthly)}/mo, business purchase <= ~${money(CRITERIA.businessBudgetTotal)}. ` +
      `Size: ${CRITERIA.sqftMin}–${CRITERIA.sqftMax} sf.`
  );
  lines.push('');

  if (lease.length) {
    lines.push(`## Space for lease (${lease.length})`);
    lines.push(...lease.map(formatListing));
    lines.push('');
  }
  if (business.length) {
    lines.push(`## Businesses for sale (${business.length})`);
    lines.push(...business.map(formatListing));
    lines.push('');
  }
  if (failedSources.length) {
    lines.push(`## Sources that failed this run (${failedSources.length}) — check the log`);
    lines.push(...failedSources.map((f) => `- ${f.source}: ${f.error}`));
  }

  return lines.join('\n');
}

export async function sendDigest(newListings, failedSources) {
  if (!EMAIL.smtpUser || !EMAIL.smtpPass || !EMAIL.to) {
    throw new Error('Email not configured - set SMTP_USER, SMTP_PASS, DIGEST_TO in .env');
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL.smtpHost,
    port: EMAIL.smtpPort,
    secure: EMAIL.smtpPort === 465,
    auth: { user: EMAIL.smtpUser, pass: EMAIL.smtpPass },
  });

  const body = buildDigest(newListings, failedSources);
  await transporter.sendMail({
    from: EMAIL.from,
    to: EMAIL.to,
    subject: `Cafe space finder: ${newListings.length} new listing(s)`,
    text: body,
  });
}
