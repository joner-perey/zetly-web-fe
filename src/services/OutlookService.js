/**
 * OutlookService.js
 * Microsoft Graph API integration for sending emails with attachments
 * directly from the signed-in admin's Outlook account.
 *
 * Flow:
 *   1. Admin clicks "Send Email" for the first time → MSAL popup login
 *   2. Token is cached by MSAL for subsequent clicks (silent refresh)
 *   3. Graph API POST /me/sendMail sends the email with QR PNG attached
 */

import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

// ─── Azure App Registration Config ───────────────────────────────────────────
// Set REACT_APP_AZURE_CLIENT_ID and REACT_APP_AZURE_TENANT_ID in .env.local
const MSAL_CONFIG = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin, // e.g. http://localhost:3000
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Graph API scope required to send emails
const GRAPH_SCOPES = ['Mail.Send'];

// Graph API sendMail endpoint — sends immediately, no draft created
const GRAPH_SEND_MAIL_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/sendMail';

// ─── MSAL Instance (singleton) ───────────────────────────────────────────────
let msalInstance = null;

const getMsalInstance = () => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(MSAL_CONFIG);
  }
  return msalInstance;
};

// ─── Auth: Get Access Token ──────────────────────────────────────────────────
/**
 * Attempts silent token acquisition first.
 * Falls back to an interactive popup if the user hasn't logged in yet
 * or if the cached token has expired and silent refresh fails.
 */
const getAccessToken = async () => {
  const msal = getMsalInstance();
  await msal.initialize();

  const accounts = msal.getAllAccounts();

  if (accounts.length > 0) {
    try {
      const silentResult = await msal.acquireTokenSilent({
        scopes: GRAPH_SCOPES,
        account: accounts[0],
      });
      return silentResult.accessToken;
    } catch (err) {
      if (!(err instanceof InteractionRequiredAuthError)) {
        throw err;
      }
    }
  }

  // Interactive login popup (shown on first use or after token expiry)
  const popupResult = await msal.acquireTokenPopup({ scopes: GRAPH_SCOPES });
  return popupResult.accessToken;
};

// ─── Graph API: Send Email Directly ──────────────────────────────────────────
/**
 * Sends an email immediately via Graph API from the admin's Outlook account.
 * The email is also saved to Sent Items.
 *
 * @param {object} params
 * @param {string} params.toEmail        - Recipient email address
 * @param {string} params.subject        - Email subject line
 * @param {string} params.htmlBody       - HTML email body (use cid:zetly_qr_image for inline QR)
 * @param {string} params.base64Image    - Base64-encoded PNG (no data: prefix)
 * @param {string} params.attachmentName - Filename for the QR PNG attachment
 * @returns {Promise<void>}
 */
export const sendOutlookEmail = async ({
  toEmail,
  subject,
  htmlBody,
  base64Image,
  attachmentName,
}) => {
  const accessToken = await getAccessToken();

  const payload = {
    message: {
      subject,
      importance: 'Normal',
      body: {
        contentType: 'HTML',
        content: htmlBody,
      },
      toRecipients: toEmail
        ? [{ emailAddress: { address: toEmail } }]
        : [],
      attachments: [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: attachmentName,
          contentType: 'image/png',
          contentBytes: base64Image,
          isInline: true,
          contentId: 'zetly_qr_image', // matches src="cid:zetly_qr_image" in HTML body
        },
      ],
    },
    saveToSentItems: true, // saves a copy to admin's Sent Items folder
  };

  const response = await fetch(GRAPH_SEND_MAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // 202 Accepted = email queued for delivery; anything else = error
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMsg = errorBody?.error?.message || `Graph API error: ${response.status}`;
    throw new Error(errorMsg);
  }
};

// ─── Check if Azure credentials are configured ───────────────────────────────
export const isOutlookConfigured = () => {
  return Boolean(
    process.env.REACT_APP_AZURE_CLIENT_ID &&
    process.env.REACT_APP_AZURE_CLIENT_ID !== 'YOUR_CLIENT_ID_HERE'
  );
};
