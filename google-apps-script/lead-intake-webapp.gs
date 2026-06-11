const SHEET_NAME = '상담접수';

const HEADERS = [
  '접수일시',
  '브랜드명',
  'company 값',
  '주소/건물명',
  '공간 유형',
  '상담 종류',
  '에어컨 종류',
  '에어컨 대수',
  '청소 이유',
  '에어컨 추가 내용',
  '평수/면적',
  '주거 구조',
  '상업 공간 형태',
  '작업 범위',
  '영업 상태',
  '짐/집기 여부',
  '오염 상태',
  '사진 상태',
  '희망 일정',
  '희망 시간대',
  '추가 요청사항',
  '선호 연락 방법',
  '고객이 선택한 연락 버튼',
  '관리자 상담 요약',
  '유입 경로',
  '접수 상태'
];

function doPost(e) {
  try {
    const sheet = getOrCreateSheet_();
    const data = parsePayload_(e);

    sheet.appendRow([
      data.receivedAt || new Date(),
      data.brandName || '',
      data.company || '',
      data.address || '',
      data.spaceType || '',
      data.serviceKinds || '',
      data.airconTypes || '',
      data.airconCount || '',
      data.airconConcerns || '',
      data.airconNote || '',
      data.area || '',
      data.homeStructure || '',
      data.commercialShape || '',
      data.workScope || '',
      data.businessStatus || '',
      data.fixtureLevel || '',
      data.dirtStatus || '',
      data.photoStatus || '상담 후 별도 전송',
      data.preferredSchedule || '',
      data.preferredTime || '',
      data.requestNote || '',
      data.preferredContact || '',
      data.selectedContactButton || '',
      data.managerSummary || '',
      data.source || '',
      data.leadStatus || '신규 접수'
    ]);

    try {
      sendTelegramLeadAlert_(data);
    } catch (telegramError) {
      console.error('Telegram alert failed', telegramError);
    }

    return json_({ ok: true, message: 'saved' });
  } catch (error) {
    return json_({ ok: false, message: String(error && error.message ? error.message : error) });
  }
}

function doGet() {
  getOrCreateSheet_();
  return json_({ ok: true, message: 'lead intake web app is ready' });
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeader = currentHeaders.every((cell) => !cell);
  if (needsHeader) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendTelegramLeadAlert_(data) {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty('TELEGRAM_BOT_TOKEN');
  const chatIdsValue = properties.getProperty('TELEGRAM_CHAT_IDS') || properties.getProperty('TELEGRAM_CHAT_ID');

  if (!token || !chatIdsValue) {
    console.log('Telegram alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_IDS is missing');
    return { ok: false, skipped: true, message: 'missing telegram properties' };
  }

  const chatIds = chatIdsValue
    .split(',')
    .map((chatId) => chatId.trim())
    .filter(Boolean);

  if (!chatIds.length) {
    console.log('Telegram alert skipped: no valid chat ids');
    return { ok: false, skipped: true, message: 'empty chat ids' };
  }

  const message = buildTelegramLeadMessage_(data);
  const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  const results = [];

  chatIds.forEach((chatId) => {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true
      })
    });
    const statusCode = response.getResponseCode();
    const body = response.getContentText();
    results.push({ chatId, statusCode, body });
    if (statusCode < 200 || statusCode >= 300) {
      console.error('Telegram sendMessage failed for chat_id=' + chatId + ': ' + body);
    }
  });

  return { ok: true, results };
}

function buildTelegramLeadMessage_(data) {
  const title = getTelegramLeadTitle_(data);
  const address = data.address || '주소 미입력';
  const serviceKinds = data.serviceKinds || '상담 종류 미입력';
  const airconTypes = data.airconTypes || '';
  const airconCount = data.airconCount || '';
  const airconInfo = [airconTypes, airconCount].filter(Boolean).join(' / ') || '해당 없음';
  const schedule = [data.preferredSchedule, data.preferredTime].filter(Boolean).join(' / ') || '희망 일정 미입력';
  const contact = data.preferredContact || data.selectedContactButton || '연락 방법 미입력';
  const photoStatus = data.photoStatus || '상담 후 별도 전송';
  const requestNote = data.requestNote || data.airconNote || '';

  const lines = [
    title,
    '',
    '주소: ' + address,
    '상담: ' + serviceKinds,
    '에어컨: ' + airconInfo,
    '희망: ' + schedule,
    '연락: ' + contact,
    '사진: ' + photoStatus
  ];

  if (requestNote) {
    lines.push('', '요청:', requestNote);
  }

  lines.push('', '상세 내용은 상담접수 시트에서 확인해주세요.');

  return lines.join('\n').slice(0, 2000);
}

function getTelegramLeadTitle_(data) {
  const rowText = [
    data.brandName,
    data.company,
    data.address,
    data.serviceKinds,
    data.airconNote,
    data.requestNote,
    data.managerSummary,
    data.leadStatus
  ].map((value) => String(value || '')).join(' ');

  const testMarkers = ['테스트', '진단', 'telegram-test', 'hermes-test', 'diagnostic', 'Chrome', 'sendBeacon'];
  if (testMarkers.some((marker) => rowText.includes(marker))) {
    return '[테스트 상담 접수]';
  }
  if (String(data.company || '').includes('tsunami') || String(data.brandName || '').includes('쓰나미')) {
    return '[쓰나미 신규 상담]';
  }
  if (String(data.company || '').includes('zendella') || String(data.brandName || '').includes('전데렐라')) {
    return '[전데렐라 신규 상담]';
  }
  return '[신규 상담 접수]';
}

function testTelegramLeadAlert() {
  const result = sendTelegramLeadAlert_({
    brandName: '라비 알림 테스트',
    company: 'telegram-test',
    address: 'Telegram 알림 연결 테스트',
    spaceType: '테스트',
    serviceKinds: '상담접수 알림 테스트',
    airconTypes: '벽걸이',
    airconCount: '1대',
    preferredSchedule: '테스트 일정',
    preferredTime: '테스트 시간',
    preferredContact: 'Telegram 알림',
    requestNote: 'Script Properties 연결 확인용 테스트입니다.',
    managerSummary: '이 메시지가 윤경님 DM에 도착하면 Telegram 알림 준비가 된 상태입니다.'
  });
  return json_(result);
}

const STATUS_OPTIONS = [
  '신규 접수',
  '상담 진행중',
  '견적 안내',
  '예약 확정',
  '작업 완료',
  '후기 요청',
  '보류',
  '취소',
  '테스트'
];

const TEST_ROW_MARKERS = [
  '라비 저장 테스트',
  '진단테스트',
  'diagnostic-direct',
  'hermes-test',
  '공개폼 저장테스트',
  '브라우저공개폼진단',
  '최종브라우저진단',
  'Chrome 공개폼 진단',
  'sendBeacon 최종진단'
];

function setupConsultationSheetForOps() {
  const sheet = getOrCreateSheet_();
  const deletedRows = deleteTestRows_(sheet);
  ensureOperationalHeaders_(sheet);
  applyOperationalFormatting_(sheet);
  applyStatusDropdown_(sheet);
  applyBrandConditionalFormatting_(sheet);
  return json_({ ok: true, message: 'operations sheet prepared', deletedRows });
}

function deleteTestRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return 0;

  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const rowsToDelete = [];
  values.forEach((row, index) => {
    const rowText = row.map((cell) => String(cell || '')).join(' ');
    if (TEST_ROW_MARKERS.some((marker) => rowText.includes(marker))) {
      rowsToDelete.push(index + 2);
    }
  });

  rowsToDelete.reverse().forEach((rowNumber) => sheet.deleteRow(rowNumber));
  return rowsToDelete.length;
}

function ensureOperationalHeaders_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const hasAnyHeader = currentHeaders.some((cell) => cell);
  if (!hasAnyHeader) headerRange.setValues([HEADERS]);
}

function applyOperationalFormatting_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const lastRow = Math.max(sheet.getLastRow(), 2);

  sheet.setFrozenRows(1);

  const filterRange = sheet.getRange(1, 1, lastRow, lastColumn);
  if (sheet.getFilter()) sheet.getFilter().remove();
  filterRange.createFilter();

  sheet.getRange(1, 1, 1, lastColumn)
    .setFontWeight('bold')
    .setBackground('#F1F5F9')
    .setHorizontalAlignment('center');

  const widths = {
    '접수일시': 170,
    '브랜드명': 160,
    'company 값': 100,
    '주소/건물명': 220,
    '공간 유형': 120,
    '상담 종류': 180,
    '에어컨 종류': 140,
    '에어컨 대수': 100,
    '청소 이유': 200,
    '에어컨 추가 내용': 240,
    '평수/면적': 120,
    '주거 구조': 180,
    '상업 공간 형태': 180,
    '작업 범위': 180,
    '영업 상태': 120,
    '짐/집기 여부': 140,
    '오염 상태': 200,
    '사진 상태': 150,
    '희망 일정': 140,
    '희망 시간대': 130,
    '추가 요청사항': 260,
    '선호 연락 방법': 140,
    '고객이 선택한 연락 버튼': 170,
    '관리자 상담 요약': 520,
    '유입 경로': 260,
    '접수 상태': 130
  };

  HEADERS.forEach((header, index) => {
    sheet.setColumnWidth(index + 1, widths[header] || 140);
  });
  sheet.getRange(1, 1, lastRow, lastColumn).setVerticalAlignment('middle');
  sheet.getRange(2, 1, Math.max(lastRow - 1, 1), lastColumn).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
}

function applyStatusDropdown_(sheet) {
  const statusColumn = HEADERS.indexOf('접수 상태') + 1;
  if (statusColumn < 1) return;
  const maxRows = Math.max(sheet.getMaxRows() - 1, 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusColumn, maxRows, 1).setDataValidation(rule);
}

function applyBrandConditionalFormatting_(sheet) {
  const lastRow = Math.max(sheet.getMaxRows(), 2);
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const brandColumn = HEADERS.indexOf('브랜드명') + 1;
  const statusColumn = HEADERS.indexOf('접수 상태') + 1;
  const rules = [];

  if (brandColumn > 0) {
    const brandRange = sheet.getRange(2, brandColumn, lastRow - 1, 1);
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('전데렐라')
        .setBackground('#E7F5EF')
        .setRanges([brandRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('쓰나미')
        .setBackground('#EAF5FF')
        .setRanges([brandRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('테스트')
        .setBackground('#F3F4F6')
        .setRanges([brandRange])
        .build()
    );
  }

  if (statusColumn > 0) {
    const statusRange = sheet.getRange(2, statusColumn, lastRow - 1, 1);
    const statusColors = {
      '신규 접수': '#FEF3C7',
      '상담 진행중': '#DBEAFE',
      '견적 안내': '#EDE9FE',
      '예약 확정': '#DCFCE7',
      '작업 완료': '#D1FAE5',
      '후기 요청': '#FCE7F3',
      '보류': '#F3F4F6',
      '취소': '#FEE2E2',
      '테스트': '#E5E7EB'
    };
    Object.keys(statusColors).forEach((status) => {
      rules.push(
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(status)
          .setBackground(statusColors[status])
          .setRanges([statusRange])
          .build()
      );
    });
  }

  sheet.setConditionalFormatRules(rules);
}
