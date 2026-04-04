const CONFIG = {
  sheetName: 'Endorsement Submissions',
  notifyEmail: 'campaign@example.org',
  allowedType: 'endorsement',
  allowedModes: ['organization', 'individual'],
  requiredFields: ['type', 'name', 'email', 'submitted_at', 'endorsement_mode', 'secondary_label', 'secondary_value', 'review_status']
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);

    if (payload.type !== CONFIG.allowedType) {
      return jsonResponse_({ ok: false, error: 'invalid-type' });
    }

    if (payload.honeypot) {
      return jsonResponse_({ ok: false, error: 'spam-blocked' });
    }

    const validationError = validatePayload_(payload);
    if (validationError) {
      return jsonResponse_({ ok: false, error: validationError });
    }

    getTargetSheet_().appendRow(buildRow_(payload));
    sendNotification_(payload);

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: 'server-error' });
  }
}

function parsePayload_(e) {
  const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  const payload = JSON.parse(rawBody);
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }

  return payload;
}

function validatePayload_(payload) {
  for (const fieldName of CONFIG.requiredFields) {
    if (!String(payload[fieldName] || '').trim()) {
      return `missing-${fieldName}`;
    }
  }

  if (!CONFIG.allowedModes.includes(payload.endorsement_mode)) {
    return 'invalid-endorsement-mode';
  }

  if (payload.review_status !== 'pending') {
    return 'invalid-review-status';
  }

  return '';
}

function getTargetSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    throw new Error(`Missing sheet: ${CONFIG.sheetName}`);
  }

  return sheet;
}

function buildRow_(payload) {
  return [
    payload.submitted_at || '',
    payload.endorsement_mode || '',
    payload.name || '',
    payload.secondary_label || '',
    payload.secondary_value || '',
    payload.email || '',
    payload.message || '',
    payload.review_status || 'pending',
    payload.source_page || '',
    payload.locale || '',
    'clear'
  ];
}

function sendNotification_(payload) {
  if (!CONFIG.notifyEmail) return;

  const subject = `[RM] New ${payload.endorsement_mode || 'endorsement'} endorsement`;
  const body = [
    'A new endorsement submission has arrived.',
    '',
    `Submitted: ${payload.submitted_at || ''}`,
    `Mode: ${payload.endorsement_mode || ''}`,
    `Name: ${payload.name || ''}`,
    `${payload.secondary_label || 'Additional info'}: ${payload.secondary_value || ''}`,
    `Email: ${payload.email || ''}`,
    payload.message ? `Message: ${payload.message}` : '',
    `Review status: ${payload.review_status || 'pending'}`,
    payload.source_page ? `Source page: ${payload.source_page}` : '',
    payload.locale ? `Locale: ${payload.locale}` : ''
  ].filter(Boolean).join('\n');

  MailApp.sendEmail(CONFIG.notifyEmail, subject, body);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}