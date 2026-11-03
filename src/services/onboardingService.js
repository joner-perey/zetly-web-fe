/**
 * Onboarding Service: Handles patient registration and direct QR code
 * email delivery via Laravel Backend + SMTP (no Microsoft Graph API required).
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Send base64 QR code directly to Laravel backend to email via SMTP.
 *
 * @param {Object} params
 * @param {string} params.email - Recipient email address (Required)
 * @param {string} params.qrCodeBase64 - Base64 PNG data URL or raw string (Required)
 * @param {number} [params.clientId] - ID of registered client
 * @param {string} [params.clientCode] - Member/Client code (e.g. ZT-10501)
 * @param {string} [params.patientName] - Patient full name
 * @param {string} [params.insurance] - Insurance provider
 * @param {string} [params.policyNumber] - Policy or certificate number
 * @param {string} [params.planType] - Insurance coverage/plan
 * @param {boolean} [params.cashless] - Cashless eligibility
 * @param {string} [params.onboardUrl] - Activation link
 * @param {string} [params.token] - Sanctum Bearer token (if authenticated)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendQrEmail({
  email,
  qrCodeBase64,
  clientId,
  clientCode,
  patientName,
  insurance,
  policyNumber,
  planType,
  cashless = true,
  onboardUrl,
  token,
}) {
  const authToken = token || localStorage.getItem('zetly-api-token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Use protected route if logged in, fallback to dev open route for dev testing
  const endpoint = authToken
    ? `${API_BASE_URL}/clients/send-qr-email`
    : `${API_BASE_URL}/dev/clients/send-qr-email`;

  const payload = {
    email,
    qr_code: qrCodeBase64,
    client_id: clientId,
    client_code: clientCode,
    patient_name: patientName,
    insurance,
    policy_number: policyNumber,
    plan_type: planType,
    cashless,
    onboard_url: onboardUrl,
    qr_file_name: `zetly-qr-${(clientCode || 'member').replace(/[^a-zA-Z0-9]/g, '_')}.png`,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errMsg = data.message;
    if (data.errors) {
      errMsg = Object.values(data.errors).flat().join('. ');
    }
    throw new Error(errMsg || `HTTP error ${response.status}`);
  }

  return data;
}

/**
 * Register a client and optionally send the base64 QR email in a single request.
 */
export async function registerClientWithQr(clientData, token) {
  const authToken = token || localStorage.getItem('zetly-api-token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const endpoint = authToken
    ? `${API_BASE_URL}/clients/register-qr`
    : `${API_BASE_URL}/dev/clients/register-qr`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(clientData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errMsg = data.message;
    if (data.errors) {
      errMsg = Object.values(data.errors).flat().join('. ');
    }
    throw new Error(errMsg || 'Registration failed');
  }

  return data;
}

/**
 * Check whether a client_code is already registered in the backend database.
 *
 * @param {string} clientCode
 * @param {string} [token]
 * @returns {Promise<{exists: boolean, available: boolean, message: string, client?: any}>}
 */
export async function checkClientCodeExists(clientCode, token) {
  if (!clientCode || !clientCode.trim()) {
    return { exists: false, available: true, message: 'Client code is required.' };
  }

  const authToken = token || localStorage.getItem('zetly-api-token');
  const headers = {
    'Accept': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const endpoint = authToken
    ? `${API_BASE_URL}/clients/check-code?client_code=${encodeURIComponent(clientCode.trim())}`
    : `${API_BASE_URL}/dev/clients/check-code?client_code=${encodeURIComponent(clientCode.trim())}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return data;
    }
    return {
      exists: false,
      available: true,
      message: data.message || 'Unable to check code.',
    };
  } catch (err) {
    console.warn('checkClientCodeExists request failed:', err.message);
    return { exists: false, available: true, message: err.message };
  }
}


/**
 * Check whether a patient email is already registered in the backend database.
 *
 * @param {string} email
 * @param {string} [token]
 * @returns {Promise<{exists: boolean, available: boolean, message: string, client?: any}>}
 */
export async function checkClientEmailExists(email, token) {
  if (!email || !email.trim()) {
    return { exists: false, available: true, message: 'Email address is required.' };
  }

  const authToken = token || localStorage.getItem('zetly-api-token');
  const headers = {
    'Accept': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const endpoint = authToken
    ? `${API_BASE_URL}/clients/check-email?email=${encodeURIComponent(email.trim())}`
    : `${API_BASE_URL}/dev/clients/check-email?email=${encodeURIComponent(email.trim())}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return data;
    }
    return {
      exists: false,
      available: true,
      message: data.message || 'Unable to check email.',
    };
  } catch (err) {
    console.warn('checkClientEmailExists request failed:', err.message);
    return { exists: false, available: true, message: err.message };
  }
}
