const CONFIG = {
  sheetName: 'Volunteer Submissions',
  notifyEmail: 'campaign@example.org',
  allowedType: 'volunteer',
  requiredFields: ['type', 'name', 'email', 'submitted_at']
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

  if (!Array.isArray(payload.volunteer_areas)) {
    return 'invalid-volunteer-areas';
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
    payload.name || '',
    payload.email || '',
    payload.volunteer_areas.join(', '),
    payload.message || '',
    payload.source_page || '',
    payload.locale || '',
    'clear'
  ];
}

function sendNotification_(payload) {
  if (!CONFIG.notifyEmail) return;

  const subject = '[RM] New volunteer signup';
  const body = [
    'A new volunteer signup has arrived.',
    '',
    `Submitted: ${payload.submitted_at || ''}`,
    `Name: ${payload.name || ''}`,
    `Email: ${payload.email || ''}`,
    `Volunteer areas: ${payload.volunteer_areas.join(', ') || 'None selected'}`,
    payload.message ? `Message: ${payload.message}` : '',
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