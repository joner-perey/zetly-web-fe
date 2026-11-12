/**
 * Onboarding Service: Handles patient registration and direct QR code
 * email delivery via Laravel Backend + SMTP (no Microsoft Graph API required).
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Internal helper to perform API requests with automatic fallback to /api/dev/*
 * if a stored token is stale or a route requires the dev prefix.
 */
async function requestWithFallback(path, options = {}, explicitToken = null) {
  const authToken = explicitToken || localStorage.getItem('zetly-api-token');

  const buildHeaders = (includeAuth) => {
    const headers = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };
    if (includeAuth && authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return headers;
  };

  const primaryEndpoint = `${API_BASE_URL}${path}`;
  const fallbackEndpoint = `${API_BASE_URL}/dev${path}`;

  let response = await fetch(primaryEndpoint, {
    ...options,
    headers: buildHeaders(true),
  });

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    if (response.status === 401 && !explicitToken) {
      localStorage.removeItem('zetly-api-token');
    }
    response = await fetch(fallbackEndpoint, {
      ...options,
      headers: buildHeaders(false),
    });
  }

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

/**
 * Send base64 QR code directly to Laravel backend to email via SMTP.
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

  const { response, data } = await requestWithFallback(
    '/clients/send-qr-email',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );

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
  const { response, data } = await requestWithFallback(
    '/clients/register-qr',
    {
      method: 'POST',
      body: JSON.stringify(clientData),
    },
    token
  );

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
 */
export async function checkClientCodeExists(clientCode, token) {
  if (!clientCode || !clientCode.trim()) {
    return { exists: false, available: true, message: 'Client code is required.' };
  }

  try {
    const { response, data } = await requestWithFallback(
      `/clients/check-code?client_code=${encodeURIComponent(clientCode.trim())}`,
      { method: 'GET' },
      token
    );

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
 */
export async function checkClientEmailExists(email, token) {
  if (!email || !email.trim()) {
    return { exists: false, available: true, message: 'Email address is required.' };
  }

  try {
    const { response, data } = await requestWithFallback(
      `/clients/check-email?email=${encodeURIComponent(email.trim())}`,
      { method: 'GET' },
      token
    );

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

/**
 * Fetch all registered patients/clients for the Register Patient (QR) page.
 */
export async function fetchRegisteredClients({ search = '', status = 'All' } = {}, token) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status && status !== 'All') params.set('status', status);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const { response, data } = await requestWithFallback(
    `/clients${queryString}`,
    { method: 'GET' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch registered patients (HTTP ${response.status}).`);
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.clients)) return data.clients;
  return [];
}

/**
 * Fetch all appointments booked via mobile app for the Intake Queue page.
 */
export async function fetchIntakeQueue({ search = '', status = 'All' } = {}, token) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status && status !== 'All') params.set('status', status);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const { response, data } = await requestWithFallback(
    `/intake-queue${queryString}`,
    { method: 'GET' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch intake queue (HTTP ${response.status}).`);
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * Approve intake request and notify clinic.
 */
export async function sendIntakeToClinic(appointmentId, token) {
  const { response, data } = await requestWithFallback(
    `/intake-queue/${appointmentId}/send-to-clinic`,
    { method: 'POST' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to approve intake request.');
  }

  return data;
}

/**
 * Decline intake request.
 */
export async function declineIntakeRequest(appointmentId, reason = 'Declined by claims reviewer', token) {
  const { response, data } = await requestWithFallback(
    `/intake-queue/${appointmentId}/decline`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to decline intake request.');
  }

  return data;
}

/**
 * Update a patient's profile, insurance policy, or cashless eligibility.
 */
export async function updateClientDetails(clientId, payload, token) {
  const { response, data } = await requestWithFallback(
    `/clients/${clientId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update patient details.');
  }

  return data;
}

/**
 * Re-issue a new onboarding QR token for a patient and reset status to pending_activation.
 */
export async function reissueClientQr(clientId, token) {
  const { response, data } = await requestWithFallback(
    `/clients/${clientId}/reissue-qr`,
    { method: 'POST' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to re-issue onboarding QR.');
  }

  return data;
}

/**
 * Delete a registered patient record.
 */
export async function deleteClientRecord(clientId, token) {
  const { response, data } = await requestWithFallback(
    `/clients/${clientId}`,
    { method: 'DELETE' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete patient record.');
  }

  return data;
}

/**
 * Fetch all panel doctors for the Panel page and Directory.
 */
export async function fetchPanelDoctors({ search = '', specialty = 'All' } = {}, token) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (specialty && specialty !== 'All') params.set('specialty', specialty);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const { response, data } = await requestWithFallback(
    `/doctors${queryString}`,
    { method: 'GET' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch panel doctors (HTTP ${response.status}).`);
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * Add a new doctor to the panel.
 */
export async function createPanelDoctor(doctorData, token) {
  const { response, data } = await requestWithFallback(
    '/doctors',
    {
      method: 'POST',
      body: JSON.stringify(doctorData),
    },
    token
  );

  if (!response.ok) {
    let errMsg = data.message;
    if (data.errors) {
      errMsg = Object.values(data.errors).flat().join('. ');
    }
    throw new Error(errMsg || 'Failed to add doctor to panel.');
  }

  return data;
}

/**
 * Update a panel doctor's details, consultation fee, SMC status, or cashless eligibility.
 */
export async function updatePanelDoctor(doctorId, payload, token) {
  const { response, data } = await requestWithFallback(
    `/doctors/${doctorId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token
  );

  if (!response.ok) {
    let errMsg = data.message;
    if (data.errors) {
      errMsg = Object.values(data.errors).flat().join('. ');
    }
    throw new Error(errMsg || 'Failed to update doctor details.');
  }

  return data;
}

/**
 * Verify a panel doctor's SMC registration credential.
 */
export async function verifyDoctorSmc(doctorId, token) {
  const { response, data } = await requestWithFallback(
    `/doctors/${doctorId}/verify-smc`,
    { method: 'POST' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify SMC credential.');
  }

  return data;
}

/**
 * Delete a doctor from the panel.
 */
export async function deletePanelDoctor(doctorId, token) {
  const { response, data } = await requestWithFallback(
    `/doctors/${doctorId}`,
    { method: 'DELETE' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete doctor.');
  }

  return data;
}

/**
 * Fetch all content / health tips (Supports status query: 'all', 'published', 'draft').
 */
export async function fetchContents(status = 'all') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const { response, data } = await requestWithFallback(`/contents${query}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load content feed.');
  }

  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Update content (e.g. publish draft or update details).
 */
export async function updateContent(contentId, payload, token) {
  const { response, data } = await requestWithFallback(
    `/contents/${contentId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update content.');
  }

  return data;
}

/**
 * Publish a new health tip / article (supports FormData for image upload).
 */
export async function publishContent(formDataOrPayload, token) {
  const authToken = token || localStorage.getItem('zetly-api-token');
  const isFormData = typeof FormData !== 'undefined' && formDataOrPayload instanceof FormData;

  const headers = {
    Accept: 'application/json',
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const primaryEndpoint = `${API_BASE_URL}/contents`;
  const fallbackEndpoint = `${API_BASE_URL}/dev/contents`;

  const body = isFormData ? formDataOrPayload : JSON.stringify(formDataOrPayload);

  let response = await fetch(primaryEndpoint, {
    method: 'POST',
    headers,
    body,
  });

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    const fallbackHeaders = { Accept: 'application/json' };
    if (!isFormData) fallbackHeaders['Content-Type'] = 'application/json';
    response = await fetch(fallbackEndpoint, {
      method: 'POST',
      headers: fallbackHeaders,
      body,
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errMsg = data.message;
    if (data.errors) {
      errMsg = Object.values(data.errors).flat().join('. ');
    }
    throw new Error(errMsg || 'Failed to publish content.');
  }

  return data;
}

/**
 * Delete a content item.
 */
export async function deleteContent(contentId, token) {
  const { response, data } = await requestWithFallback(
    `/contents/${contentId}`,
    { method: 'DELETE' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete content.');
  }

  return data;
}

/**
 * Fetch all referrals (supports status filter).
 */
export async function fetchReferrals(status = 'all') {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const { response, data } = await requestWithFallback(`/referrals${query}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load referrals.');
  }

  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Fetch referral stats (funnel counts, pending amount, referral links).
 */
export async function fetchReferralStats() {
  const { response, data } = await requestWithFallback('/referrals/stats', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load referral stats.');
  }

  return data;
}

/**
 * Create a new referral from popup dialog.
 */
export async function createReferral(payload, token) {
  const { response, data } = await requestWithFallback(
    '/referrals',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );

  if (!response.ok) {
    let errMsg = data.message;
    if (data.errors) {
      errMsg = Object.values(data.errors).flat().join('. ');
    }
    throw new Error(errMsg || 'Failed to create referral.');
  }

  return data;
}

/**
 * Admin manually updates a referral's status.
 */
export async function updateReferralStatus(referralId, status, token) {
  const { response, data } = await requestWithFallback(
    `/referrals/${referralId}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({ status }),
    },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update referral status.');
  }

  return data;
}

/**
 * Delete a referral record.
 */
export async function deleteReferral(referralId, token) {
  const { response, data } = await requestWithFallback(
    `/referrals/${referralId}`,
    { method: 'DELETE' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete referral.');
  }

  return data;
}

/**
 * Resolve a referral link code (returns assigned doctor/clinic info).
 */
export async function resolveReferralLink(code) {
  const { response, data } = await requestWithFallback(`/referral-links/${encodeURIComponent(code)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(data.message || 'Invalid referral link.');
  }

  return data;
}

/**
 * Create a new referral link in the referral_links table.
 */
export async function createReferralLink(payload, token) {
  const { response, data } = await requestWithFallback(
    '/referral-links',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );

  if (!response.ok) {
    let errMsg = data.message;
    if (data.errors) {
      errMsg = Object.values(data.errors).flat().join('. ');
    }
    throw new Error(errMsg || 'Failed to create referral link.');
  }

  return data;
}

/**
 * Delete a referral link.
 */
export async function deleteReferralLink(id, token) {
  const { response, data } = await requestWithFallback(
    `/referral-links/${id}`,
    { method: 'DELETE' },
    token
  );

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete referral link.');
  }

  return data;
}

// Aliases for Referral Code terminology
export const createReferralCode = createReferralLink;
export const deleteReferralCode = deleteReferralLink;

/**
 * Validate a referral code against the backend API.
 */
export async function validateReferralCode(code) {
  const { response, data } = await requestWithFallback(
    `/referrals/validate-code/${encodeURIComponent(code.trim().toUpperCase())}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(data.message || 'Invalid referral code.');
  }

  return data;
}



