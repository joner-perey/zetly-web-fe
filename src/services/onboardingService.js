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

