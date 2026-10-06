import { classifyProviderError, recordProviderResult } from './email-supervisor.js';

function getAccountConfig(accountType) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.google_client_id || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.google_client_secret || '').trim();

  if (accountType === 'backup') {
    const refreshToken = (
      process.env.BACKUP_GOOGLE_REFRESH_TOKEN ||
      process.env.backup_google_refresh_token ||
      process.env.BACKUP_REFRESH_TOKEN ||
      ''
    ).trim();
    const senderAddress = (process.env.BACKUP_GMAIL_ADDRESS || 'exousia2k26backup@gmail.com').trim();
    const senderHeader = process.env.BACKUP_GMAIL_SENDER_HEADER || `EXOUSIA 2K26 Backup <${senderAddress}>`;

    return { clientId, clientSecret, refreshToken, senderAddress, senderHeader, accountType: 'backup' };
  } else {
    const refreshToken = (
      process.env.PRIMARY_GOOGLE_REFRESH_TOKEN ||
      process.env.google_refresh_token ||
      process.env.GOOGLE_REFRESH_TOKEN ||
      ''
    ).trim();
    const senderAddress = (process.env.PRIMARY_GMAIL_ADDRESS || 'exousia2k26@gmail.com').trim();
    const senderHeader = process.env.GMAIL_SENDER_HEADER || `EXOUSIA 2K26 <${senderAddress}>`;

    return { clientId, clientSecret, refreshToken, senderAddress, senderHeader, accountType: 'primary' };
  }
}

async function sendWithSingleGmailAccount(config, { to, subject, html, text, attachments = [] }) {
  const { clientId, clientSecret, refreshToken, senderHeader, accountType } = config;

  if (!clientId || !clientSecret || !refreshToken || refreshToken === '[Encrypted]') {
    const err = `Gmail API OAuth credentials for ${accountType} account are unconfigured or invalid.`;
    recordProviderResult(accountType, false, 'AUTH_FAILURE', err);
    return {
      success: false,
      isRetryable: false,
      errorCategory: 'AUTH_FAILURE',
      messageId: null,
      errorMessage: err
    };
  }

  // 1. Refresh Google OAuth Access Token
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }).toString()
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error(`[Gmail OAuth ${accountType.toUpperCase()} Error]: HTTP ${tokenRes.status}`, errBody);
      const cat = classifyProviderError(errBody, tokenRes.status);
      const isTransient = cat === 'RATE_LIMIT' || cat === 'TEMPORARY_PROVIDER_FAILURE' || cat === 'NETWORK_TIMEOUT';
      recordProviderResult(accountType, false, cat, `OAuth HTTP ${tokenRes.status}: ${errBody}`);
      return {
        success: false,
        isRetryable: isTransient,
        errorCategory: cat,
        messageId: null,
        errorMessage: `OAuth token refresh for ${accountType} failed (HTTP ${tokenRes.status}): ${errBody}`
      };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      const err = `OAuth endpoint for ${accountType} did not return an access token.`;
      recordProviderResult(accountType, false, 'AUTH_FAILURE', err);
      return {
        success: false,
        isRetryable: false,
        errorCategory: 'AUTH_FAILURE',
        messageId: null,
        errorMessage: err
      };
    }

    // 2. Construct RFC 2822 MIME Email Message
    const recipient = Array.isArray(to) ? to.join(', ') : String(to || '').trim();
    const encodedSubject = (subject && /[^\x00-\x7F]/.test(subject))
      ? `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`
      : (subject || '');

    let rawMime = '';

    if (!attachments || attachments.length === 0) {
      rawMime = [
        `From: ${senderHeader}`,
        `To: ${recipient}`,
        `Subject: ${encodedSubject}`,
        `Content-Type: text/html; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        html || text || ''
      ].join('\r\n');
    } else {
      const boundary = `====_EXOUSIA_MIME_BOUNDARY_${Date.now()}_====`;
      const mimeParts = [
        `From: ${senderHeader}`,
        `To: ${recipient}`,
        `Subject: ${encodedSubject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset="UTF-8"`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        html || text || ''
      ];

      for (const att of attachments) {
        if (!att || !att.filename || !att.content) continue;
        const contentType = att.contentType || 'image/svg+xml';
        mimeParts.push(
          ``,
          `--${boundary}`,
          `Content-Type: ${contentType}; name="${att.filename}"`,
          `Content-Disposition: attachment; filename="${att.filename}"`,
          `Content-Transfer-Encoding: base64`,
          ``,
          att.content
        );
      }

      mimeParts.push(``, `--${boundary}--`);
      rawMime = mimeParts.join('\r\n');
    }

    // 3. Base64URL Encoding
    const base64UrlEmail = Buffer.from(rawMime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Dispatch Email via Gmail API (Max 3 retries with backoff per account)
    const maxAttempts = 3;
    let attempt = 0;
    let gmailRes = null;
    let errTxt = '';

    while (attempt < maxAttempts) {
      attempt++;
      gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64UrlEmail })
      });

      if (gmailRes.ok) {
        recordProviderResult(accountType, true);
        if (accountType === 'primary') {
          globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL = 0;
        }
        const gmailData = await gmailRes.json();
        return {
          success: true,
          isRetryable: false,
          errorCategory: 'SUCCESS',
          messageId: gmailData.id || null,
          accountUsed: accountType,
          errorMessage: null
        };
      }

      errTxt = await gmailRes.text();
      console.error(`[Gmail API Error - ${accountType.toUpperCase()}] Attempt ${attempt}/${maxAttempts}: HTTP ${gmailRes.status}`);

      const cat = classifyProviderError(errTxt, gmailRes.status);
      let unlockTime = 0;

      if (cat === 'RATE_LIMIT') {
        const maxLock = Date.now() + (60 * 1000);
        const retryAfterMatch = errTxt.match(/Retry after\s+([0-9T\:\.\-Z]+)/i);
        if (retryAfterMatch && retryAfterMatch[1]) {
          const parsedUntil = Date.parse(retryAfterMatch[1]);
          if (!isNaN(parsedUntil) && parsedUntil > Date.now()) {
            unlockTime = Math.min(parsedUntil, maxLock);
            globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL = unlockTime;
            console.warn(`[Gmail Rate Limit Locked] Pausing lower-priority outbox until ${new Date(unlockTime).toISOString()}`);
          }
        }
        if (!unlockTime) {
          unlockTime = Date.now() + (15 * 1000); // 15s rate limit cooldown
          globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL = unlockTime;
        }

        recordProviderResult(accountType, false, 'RATE_LIMIT', errTxt, unlockTime);

        if (attempt < maxAttempts) {
          let backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      } else {
        recordProviderResult(accountType, false, cat, errTxt);
      }
      break;
    }

    const cat = classifyProviderError(errTxt, gmailRes?.status || 0);
    const isRetryableError = cat === 'RATE_LIMIT' || cat === 'TEMPORARY_PROVIDER_FAILURE' || cat === 'NETWORK_TIMEOUT';

    return {
      success: false,
      isRetryable: isRetryableError,
      errorCategory: cat,
      messageId: null,
      accountUsed: accountType,
      errorMessage: `Gmail API ${accountType} send failed (HTTP ${gmailRes?.status || 'Unknown'}): ${errTxt}`
    };

  } catch (err) {
    console.error(`[Gmail Exception - ${accountType.toUpperCase()}]:`, err.message);
    const cat = classifyProviderError(err.message, 0);
    recordProviderResult(accountType, false, cat, err.message);
    return {
      success: false,
      isRetryable: true,
      errorCategory: cat,
      messageId: null,
      accountUsed: accountType,
      errorMessage: `Gmail ${accountType} exception: ${err.message}`
    };
  }
}

export async function sendGmailEmail({ to, subject, html, text, attachments = [] }) {
  const supervisorState = globalThis.__EXOUSIA_EMAIL_SUPERVISOR__?.providers || {};
  const now = Date.now();

  if (globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL && now >= globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL) {
    globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL = 0;
  }

  const primaryProv = supervisorState.primary || {};
  const backupProv = supervisorState.backup || {};
  const resendProv = supervisorState.resend || {};

  const primaryConfig = getAccountConfig('primary');
  const backupConfig = getAccountConfig('backup');
  const hasPrimaryCreds = Boolean(primaryConfig.refreshToken && primaryConfig.refreshToken.length > 20 && primaryConfig.refreshToken !== '[Encrypted]');
  const hasBackupCreds = Boolean(backupConfig.refreshToken && backupConfig.refreshToken.length > 20 && backupConfig.refreshToken !== '[Encrypted]');
  const hasResendCreds = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== '[Encrypted]');

  const isPrimaryRateLimitActive = Boolean((globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL && now < globalThis.__EXOUSIA_GMAIL_RATE_LIMITED_UNTIL) || (primaryProv.circuitState === 'OPEN' && primaryProv.rateLimitedUntil > now));
  const isPrimaryEligible = hasPrimaryCreds && !isPrimaryRateLimitActive;
  const isBackupEligible = (backupProv.circuitState !== 'OPEN' && backupProv.state !== 'OPEN') || (backupProv.rateLimitedUntil > 0 && now >= backupProv.rateLimitedUntil);
  const isResendEligible = (resendProv.circuitState !== 'OPEN' && resendProv.state !== 'OPEN') || (resendProv.rateLimitedUntil > 0 && now >= resendProv.rateLimitedUntil);

  let primaryErrorStr = 'Not attempted (Rate Limited / OPEN)';
  let backupErrorStr = 'Not attempted (Rate Limited / OPEN)';
  let resendErrorStr = 'Not attempted (Rate Limited / OPEN)';

  // 1. Primary Gmail Attempt (if eligible)
  if (isPrimaryEligible) {
    const primaryRes = await sendWithSingleGmailAccount(primaryConfig, { to, subject, html, text, attachments });
    if (primaryRes.success) {
      return {
        success: true,
        messageId: primaryRes.messageId,
        senderAccount: 'primary',
        errorCategory: 'SUCCESS',
        errorMessage: null
      };
    }
    primaryErrorStr = primaryRes.errorMessage || 'Unknown primary error';
    console.warn('[Primary Gmail Delivery Failed]:', primaryRes.errorMessage, '| Category:', primaryRes.errorCategory);
  } else if (hasPrimaryCreds) {
    console.log('[Primary Gmail Bypassed]: Under active rate limit window.');
  }

  // 2. Backup Gmail Attempt (if eligible & configured)
  if (hasBackupCreds && isBackupEligible) {
    console.log('[Failover Activated] Attempting Backup Gmail Sender...');
    const backupRes = await sendWithSingleGmailAccount(backupConfig, { to, subject, html, text, attachments });
    if (backupRes.success) {
      console.log('[Backup Gmail Sender Success] Message ID:', backupRes.messageId);
      return {
        success: true,
        messageId: backupRes.messageId,
        senderAccount: 'backup',
        errorCategory: 'SUCCESS',
        errorMessage: null
      };
    }
    backupErrorStr = backupRes.errorMessage || 'Unknown backup error';
    console.warn('[Backup Gmail Delivery Failed]:', backupRes.errorMessage);
  } else if (hasBackupCreds) {
    console.log('[Backup Gmail Bypassed]: Provider Circuit is OPEN (Rate Limited).');
  }

  // 3. Resend API Fallback (if eligible & configured)
  if (hasResendCreds && isResendEligible) {
    try {
      console.log('[Fallback Activated] Attempting Resend API Sender...');
      const resendKey = process.env.RESEND_API_KEY.trim();
      const senderHeader = process.env.EMAIL_FROM || process.env.GMAIL_SENDER_HEADER || 'EXOUSIA 2K26 <exousia2k26@gmail.com>';
      const recipientList = Array.isArray(to) ? to : [String(to || '').trim()];

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: senderHeader.includes('<') ? senderHeader : `EXOUSIA 2K26 <${senderHeader}>`,
          to: recipientList,
          subject: subject || 'EXOUSIA 2K26 Notification',
          html: html || text || '',
          text: text || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[Resend API Delivery Success] Message ID:', data.id);
        recordProviderResult('resend', true);
        return { success: true, messageId: data.id || null, senderAccount: 'resend', errorCategory: 'SUCCESS', errorMessage: null };
      }

      const resErrTxt = await res.text();
      const resCat = classifyProviderError(resErrTxt, res.status);
      recordProviderResult('resend', false, resCat, resErrTxt);
      resendErrorStr = `HTTP ${res.status}: ${resErrTxt}`;
      console.warn(`[Resend API Delivery Failed]: HTTP ${res.status}: ${resErrTxt}`);
    } catch (e) {
      const resCat = classifyProviderError(e.message, 0);
      recordProviderResult('resend', false, resCat, e.message);
      resendErrorStr = e.message;
      console.warn('[Resend API Exception]:', e.message);
    }
  }

  return {
    success: false,
    messageId: null,
    senderAccount: null,
    errorCategory: 'ALL_PROVIDERS_UNAVAILABLE',
    isRetryable: true,
    errorMessage: `Email transmission failed: All configured providers failed. (Primary: ${primaryErrorStr}) | (Backup: ${backupErrorStr}) | (Resend: ${resendErrorStr})`
  };
}

