const CONFIG = {
  workflowType: 'volunteer',
  sheetName: 'Submissions',
  notifyEmail: 'campaign@example.org',
  allowedTypes: ['volunteer'],
  requiredFields: ['type', 'name', 'email', 'submitted_at']
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);

    if (!CONFIG.allowedTypes.includes(payload.type)) {
      return jsonResponse_({ ok: false, error: 'invalid-type' });
    }

    if (payload.honeypot) {
      return jsonResponse_({ ok: false, error: 'spam-blocked' });
    }

    for (const fieldName of CONFIG.requiredFields) {
      if (!String(payload[fieldName] || '').trim()) {
        return jsonResponse_({ ok: false, error: `missing-${fieldName}` });
      }
    }

    const sheet = getTargetSheet_();
    sheet.appendRow(buildRow_(payload));
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
    payload.type || '',
    payload.name || '',
    payload.email || '',
    Array.isArray(payload.volunteer_areas) ? payload.volunteer_areas.join(', ') : '',
    payload.endorsement_mode || '',
    payload.secondary_label || '',
    payload.secondary_value || '',
    payload.message || '',
    payload.review_status || '',
    payload.source_page || '',
    payload.locale || '',
    payload.honeypot ? 'blocked' : 'clear'
  ];
}

function sendNotification_(payload) {
  if (!CONFIG.notifyEmail) return;

  const subject = `[RM] New ${CONFIG.workflowType} submission`;
  const body = [
    `Workflow: ${CONFIG.workflowType}`,
    `Submitted: ${payload.submitted_at || ''}`,
    `Name: ${payload.name || ''}`,
    `Email: ${payload.email || ''}`,
    payload.endorsement_mode ? `Mode: ${payload.endorsement_mode}` : '',
    payload.secondary_label ? `${payload.secondary_label}: ${payload.secondary_value || ''}` : '',
    Array.isArray(payload.volunteer_areas) ? `Volunteer areas: ${payload.volunteer_areas.join(', ')}` : '',
    payload.message ? `Message: ${payload.message}` : '',
    payload.review_status ? `Review status: ${payload.review_status}` : '',
    payload.source_page ? `Source page: ${payload.source_page}` : ''
  ].filter(Boolean).join('\n');

  MailApp.sendEmail(CONFIG.notifyEmail, subject, body);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}