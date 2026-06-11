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
  const isTestAlert = title === '[테스트 상담 접수]';
  const lines = [title, ''];

  pushLineIfValue_(lines, '주소', data.address, isTestAlert);
  pushLineIfValue_(lines, '상담', data.serviceKinds, isTestAlert);

  const hasAirconService = includesAny_(data.serviceKinds, ['에어컨', '분해청소']);
  const airconLines = [];
  pushBulletIfValue_(airconLines, '종류', data.airconTypes, isTestAlert);
  pushBulletIfValue_(airconLines, '대수', data.airconCount, isTestAlert);
  pushBulletIfValue_(airconLines, '이유', data.airconConcerns, isTestAlert);
  pushBulletIfValue_(airconLines, '추가 내용', data.airconNote, isTestAlert);
  if (hasAirconService && airconLines.length) {
    lines.push('', '에어컨:', ...airconLines);
  }

  const hasSpaceCleaningService = includesAny_(data.serviceKinds, ['입주청소', '이사청소', '거주청소', '정기청소', '상가청소', '사무실청소', '고압세척']);
  const spaceLines = [];
  pushBulletIfValue_(spaceLines, '평수/면적', data.area, isTestAlert);
  pushBulletIfValue_(spaceLines, '주거 구조', data.homeStructure, isTestAlert);
  pushBulletIfValue_(spaceLines, '작업 범위', data.workScope, isTestAlert);
  pushBulletIfValue_(spaceLines, '짐/집기', data.fixtureLevel, isTestAlert);
  pushBulletIfValue_(spaceLines, '오염 상태', data.dirtStatus, isTestAlert);
  pushBulletIfValue_(spaceLines, '상업 공간 형태', data.commercialShape, isTestAlert);
  pushBulletIfValue_(spaceLines, '영업 상태', data.businessStatus, isTestAlert);
  if (hasSpaceCleaningService && spaceLines.length) {
    lines.push('', '공간/청소:', ...spaceLines);
  }

  const schedule = joinValues_([data.preferredSchedule, data.preferredTime]);
  pushLineIfValue_(lines, '희망 일정', schedule, isTestAlert);
  pushLineIfValue_(lines, '연락 방법', data.preferredContact || data.selectedContactButton, isTestAlert);
  pushLineIfValue_(lines, '사진', data.photoStatus, isTestAlert);

  const requestNote = normalizeValue_(data.requestNote);
  if (requestNote) {
    lines.push('', '추가 요청:', requestNote);
  }

  if (isTestAlert) {
    lines.push('', '이 알림은 연결 확인용 테스트입니다.');
  }

  return lines.join('\n').slice(0, 3500);
}

function normalizeValue_(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeValue_).filter(Boolean).join(', ');
  }
  const text = String(value == null ? '' : value).trim();
  if (!text) return '';
  const hiddenValues = ['미입력', '해당 없음', '없음', '선택 안 함', '선택안함', 'undefined', 'null'];
  if (hiddenValues.includes(text)) return '';
  return text;
}

function joinValues_(values) {
  return values.map(normalizeValue_).filter(Boolean).join(' / ');
}

function pushLineIfValue_(lines, label, value, showMissing) {
  const normalized = normalizeValue_(value);
  if (normalized) {
    lines.push(label + ': ' + normalized);
  } else if (showMissing) {
    lines.push(label + ': 미입력');
  }
}

function pushBulletIfValue_(lines, label, value, showMissing) {
  const normalized = normalizeValue_(value);
  if (normalized) {
    lines.push('* ' + label + ': ' + normalized);
  } else if (showMissing) {
    lines.push('* ' + label + ': 미입력');
  }
}

function includesAny_(value, keywords) {
  const text = normalizeValue_(value);
  return keywords.some((keyword) => text.includes(keyword));
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
