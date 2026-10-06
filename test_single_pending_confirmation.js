import fs from 'fs';
import QRCode from 'qrcode';
import { sendGmailEmail } from './lib/gmail.js';
import { generateDigitalPassPng } from './lib/digital-pass.js';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    }
  });
}

loadEnv('.env.production.local');
loadEnv('.env.production');
loadEnv('.env.local');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSingleConfirmation() {
  console.log('=== TEST ONE REAL PENDING CONFIRMATION EMAIL ===');
  
  // 1. Fetch sent outbox recipients
  const sentRes = await fetch(`${supabaseUrl}/rest/v1/email_outbox?status=eq.sent&select=recipient,registration_id`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  const sentRows = await sentRes.json();
  const sentRegIds = new Set(sentRows.map(r => r.registration_id).filter(Boolean));
  const sentRecipients = new Set(sentRows.map(r => (r.recipient || '').toLowerCase()).filter(Boolean));

  // 2. Fetch all confirmed registrations
  const regRes = await fetch(`${supabaseUrl}/rest/v1/registrations?status=eq.confirmed&select=id,confirmation_code,primary_name,primary_email,primary_college,team_name&order=created_at.asc`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  const confirmedRegs = await regRes.json();

  // Find the FIRST participant in the unsent backlog
  const targetReg = confirmedRegs.find(r => {
    const rec = (r.primary_email || '').toLowerCase();
    return !sentRegIds.has(r.id) && !sentRecipients.has(rec);
  });

  if (!targetReg) {
    console.log('No unsent confirmed participant found in backlog!');
    return;
  }

  console.log('\nTarget Unsent Participant Selected for Single Test:');
  console.log('  - Registration ID:', targetReg.id);
  console.log('  - Confirmation Code:', targetReg.confirmation_code);
  console.log('  - Name:', targetReg.primary_name);
  console.log('  - Email:', targetReg.primary_email);
  console.log('  - Event Track:', targetReg.team_name);
  console.log('  - College:', targetReg.primary_college);

  // Find target outbox row
  const outRes = await fetch(`${supabaseUrl}/rest/v1/email_outbox?registration_id=eq.${targetReg.id}&limit=1`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  const outRows = await outRes.json();
  let targetOutboxRow = outRows[0] || null;

  if (!targetOutboxRow) {
    // Search by recipient email
    const recRes = await fetch(`${supabaseUrl}/rest/v1/email_outbox?recipient=eq.${encodeURIComponent(targetReg.primary_email)}&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });
    const recRows = await recRes.json();
    targetOutboxRow = recRows[0] || null;
  }

  console.log('\nTarget Outbox Row ID:', targetOutboxRow ? targetOutboxRow.id : 'None (Will insert new outbox row)');

  // 3. Prepare Email Payload
  const name = targetReg.primary_name || 'Participant';
  const regCode = targetReg.confirmation_code || 'EX-2026';
  const eventTrack = targetReg.team_name || 'EXOUSIA Event';
  const college = targetReg.primary_college || 'Institution';
  const passUrl = `https://exousia-vert.vercel.app/pass?id=${encodeURIComponent(regCode)}`;

  const subject = '🕳️ Your Confirmation Email Fell Through a Portal';
  const text = `Hey ${name},\n\nWell… this wasn't supposed to happen.\n\nYour EXOUSIA 2K26 registration went through perfectly. ✅\n\nBut your confirmation email?\n\nIt seems to have fallen through a small portal somewhere near Hawkins. 👀\n\nWe tried closing it.\n\nIt didn't work.\n\nWe tried calling Eleven.\n\nShe's busy.\n\nSo we're doing the next best thing — fixing the email system. 😭\n\nYour registration is already confirmed, and your Anomaly Pass is safe, so please don't register again.\n\nWe were supposed to send you an apology and ask you to wait a little longer…\n\nBUT WAIT.\n\n.\n.\n.\n\nAhaaa… finally found it. 👀⚡\n\nLooks like your confirmation email just made it back from the other side.\n\nAnd here it is:\n\n🎉 EXOUSIA 2K26 — REGISTRATION CONFIRMED\n\nHey ${name},\n\nYou're officially registered for EXOUSIA 2K26! ⚡\n\nYour registration has been successfully confirmed. Your Anomaly Pass is ready.\n\nRegistration Code: ${regCode}\nParticipant: ${name}\nEvent Track: ${eventTrack}\nInstitution: ${college}\nPass Link: ${passUrl}\n\nKeep this email safe — you'll need the details inside for the event.\n\nWelcome to EXOUSIA 2K26.\n\nThe portal may have caused some trouble… but Hawkins couldn't keep you out. 😎\n\n— Team EXOUSIA 2K26 // Department of EEE`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Confirmation Email Fell Through a Portal</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0e0e0e; color: #e5e2e1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #140e0f; border: 1px solid rgba(229, 9, 20, 0.35); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
    
    <div style="padding: 28px 28px 20px 28px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, #1c1012 0%, #140e0f 100%);">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; letter-spacing: 0.25em; color: #e50914; text-transform: uppercase; margin-bottom: 6px; font-weight: bold;">
        [ ANOMALY RECOVERY PROTOCOL ]
      </div>
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">
        EXOUSIA <span style="color: #e50914;">2K26</span>
      </h1>
      <div style="font-size: 12px; color: #8a7a7a; margin-top: 4px;">Department of Electrical &amp; Electronics Engineering</div>
    </div>

    <div style="padding: 28px;">
      
      <div style="background-color: #1a1012; border-left: 3px solid #e50914; border-radius: 0 10px 10px 0; padding: 20px; margin-bottom: 24px;">
        <p style="margin-top: 0; font-size: 15px; color: #ffffff; font-weight: 600;">Hey ${name},</p>
        <p style="font-size: 14px; line-height: 1.65; color: #f3e7d3; margin: 12px 0;">Well… this wasn't supposed to happen.</p>
        <p style="font-size: 14px; line-height: 1.65; color: #f3e7d3; margin: 12px 0;">Your EXOUSIA 2K26 registration went through perfectly. ✅</p>
        <p style="font-size: 14px; line-height: 1.65; color: #f3e7d3; margin: 12px 0;">But your confirmation email?</p>
        <p style="font-size: 14px; line-height: 1.65; color: #ff8a8a; font-weight: 500; margin: 12px 0;">It seems to have fallen through a small portal somewhere near Hawkins. 👀</p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 8px 0;">We tried closing it.</p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 8px 0;">It didn't work.</p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 8px 0;">We tried calling Eleven.</p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 8px 0;">She's busy.</p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 12px 0;">So we're doing the next best thing — fixing the email system. 😭</p>
        <p style="font-size: 14px; line-height: 1.65; color: #ffffff; margin: 12px 0; background-color: rgba(229, 9, 20, 0.15); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(229, 9, 20, 0.3);">Your registration is already confirmed, and your Anomaly Pass is safe, so please don't register again.</p>
        <p style="margin-bottom: 0; font-size: 14px; line-height: 1.65; color: #c4b5b2; font-style: italic;">We were supposed to send you an apology and ask you to wait a little longer…</p>
      </div>

      <div style="text-align: center; margin: 28px 0; padding: 18px 12px; background: linear-gradient(90deg, rgba(0,240,255,0.03) 0%, rgba(0,240,255,0.1) 50%, rgba(0,240,255,0.03) 100%); border-top: 1px dashed rgba(0,240,255,0.3); border-bottom: 1px dashed rgba(0,240,255,0.3); border-radius: 6px;">
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800; color: #00F0FF; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;">⚡ BUT WAIT. ⚡</div>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #00F0FF; letter-spacing: 0.3em; margin: 6px 0;">. &nbsp; . &nbsp; .</div>
        <p style="font-size: 15px; font-weight: 700; color: #ffffff; margin: 10px 0 4px 0;">Ahaaa… finally found it. 👀⚡</p>
        <p style="font-size: 13px; color: #7de8f8; margin: 4px 0;">Looks like your confirmation email just made it back from the other side.</p>
        <p style="font-size: 13px; color: #ffffff; font-weight: 600; margin: 6px 0 0 0;">And here it is:</p>
      </div>

      <div style="background-color: #0f1720; border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 12px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid rgba(0, 240, 255, 0.2);">
          <h2 style="margin: 0; color: #00F0FF; font-size: 17px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">🎉 EXOUSIA 2K26 — REGISTRATION CONFIRMED</h2>
        </div>
        <p style="margin-top: 0; font-size: 15px; color: #ffffff; font-weight: 600;">Hey ${name},</p>
        <p style="font-size: 14px; line-height: 1.65; color: #e1f5fe; margin: 12px 0;">You're officially registered for EXOUSIA 2K26! ⚡</p>
        <p style="font-size: 14px; line-height: 1.65; color: #e1f5fe; margin: 12px 0;">Your registration has been successfully confirmed. Your Anomaly Pass is ready.</p>

        <div style="background-color: #090e14; border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 8px; padding: 16px; margin: 18px 0; font-family: 'Courier New', Courier, monospace; font-size: 13px;">
          <div style="color: #7de8f8; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;">[ ANOMALY PASS SPECIFICATIONS ]</div>
          <div style="color: #ffffff; margin: 4px 0;"><span style="color: #88a0b0;">Pass ID:</span> <strong style="color: #00F0FF;">${regCode}</strong></div>
          <div style="color: #ffffff; margin: 4px 0;"><span style="color: #88a0b0;">Participant:</span> ${name}</div>
          <div style="color: #ffffff; margin: 4px 0;"><span style="color: #88a0b0;">Event Track:</span> ${eventTrack}</div>
          <div style="color: #ffffff; margin: 4px 0;"><span style="color: #88a0b0;">Institution:</span> ${college}</div>
        </div>

        <p style="font-size: 14px; line-height: 1.65; color: #e1f5fe; margin: 12px 0;">Keep this email safe — you'll need the details inside for the event.</p>
        <div style="text-align: center; margin: 24px 0 16px 0;">
          <a href="${passUrl}" target="_blank" style="background: linear-gradient(135deg, #e50914 0%, #b80710 100%); color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">VIEW ANOMALY PASS ⚡</a>
        </div>
        <p style="font-size: 14px; line-height: 1.65; color: #e1f5fe; margin: 16px 0 8px 0;">Welcome to EXOUSIA 2K26.</p>
        <p style="font-size: 14px; line-height: 1.65; color: #00F0FF; font-weight: 600; margin: 8px 0;">The portal may have caused some trouble… but Hawkins couldn't keep you out. 😎</p>
      </div>

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
        <p style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #8a7a7a; margin: 0;">— Team EXOUSIA 2K26 // Department of EEE</p>
      </div>

    </div>
  </div>
</body>
</html>`;

  let passAttachmentBase64 = null;
  try {
    const verifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(regCode)}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, color: { dark: '#000000', light: '#FFFFFF' }, width: 256 });
    const pngBuffer = await generateDigitalPassPng({ name, college, eventTrack, regCode, eventDate: 'OCT 01, 2026', qrDataUrl });
    passAttachmentBase64 = pngBuffer.toString('base64');
  } catch (e) {
    console.warn('PNG pass generation notice:', e.message);
  }

  const attachments = passAttachmentBase64 ? [
    { filename: `EXOUSIA_Digital_Pass_${regCode}.png`, content: passAttachmentBase64, contentType: 'image/png' }
  ] : [];

  // 4. Dispatch Email
  console.log('\nDispatching single test email via sendGmailEmail()...');
  const sendRes = await sendGmailEmail({
    to: targetReg.primary_email,
    subject,
    html,
    text,
    attachments
  });

  console.log('Send Result:', sendRes);

  if (sendRes.success && targetOutboxRow) {
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${targetOutboxRow.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        status: 'sent',
        error_message: null,
        sent_at: new Date().toISOString()
      })
    });
    console.log('DB Outbox Patch Status:', patchRes.status, patchRes.ok ? 'SUCCESS' : 'FAILED');
  }
}

testSingleConfirmation().catch(console.error);
