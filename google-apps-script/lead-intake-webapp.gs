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
    const rawPayload = parsePayload_(e);
    Logger.log('RAW_PAYLOAD ' + JSON.stringify(rawPayload));
    const data = normalizeLeadPayload_(rawPayload);
    Logger.log('NORMALIZED_PAYLOAD ' + JSON.stringify(data));

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
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }

  if (e && e.postData && e.postData.contents) {
    const contents = e.postData.contents;
    try {
      return JSON.parse(contents);
    } catch (jsonError) {
      const parsed = parseUrlEncodedPayload_(contents);
      if (parsed.payload) return JSON.parse(parsed.payload);
      if (Object.keys(parsed).length) return parsed;
      throw jsonError;
    }
  }

  if (e && e.parameter && Object.keys(e.parameter).length) {
    return e.parameter;
  }

  return {};
}

function parseUrlEncodedPayload_(contents) {
  const result = {};
  String(contents || '').split('&').forEach((part) => {
    if (!part) return;
    const index = part.indexOf('=');
    const rawKey = index >= 0 ? part.slice(0, index) : part;
    const rawValue = index >= 0 ? part.slice(index + 1) : '';
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    const value = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    result[key] = value;
  });
  return result;
}

function normalizeLeadPayload_(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const data = payload.data || payload.lead || payload.payload || payload;
  const summary = data.managerSummary || data.adminSummary || '';
  const parsed = parseManagerSummary_(summary);

  return {
    receivedAt: firstValue_(data.receivedAt, data.timestamp, data.createdAt, parsed.receivedAt),
    brandName: firstValue_(data.brandName, data.companyName, data.brand, parsed.brandName),
    company: firstValue_(data.company, data.companyKey, data.key),
    address: firstValue_(data.address, data.location, data.siteAddress, parsed.address),
    spaceType: firstValue_(data.spaceType, data.space, parsed.spaceType),
    serviceKinds: firstValue_(data.serviceKinds, data.services, data.serviceType, parsed.serviceKinds),
    airconTypes: firstValue_(data.airconTypes, data.airconType, parsed.airconTypes),
    airconCount: firstValue_(data.airconCount, data.airconQuantity, parsed.airconCount),
    airconConcerns: firstValue_(data.airconConcerns, data.airconReasons, data.cleaningReasons, parsed.airconConcerns),
    airconNote: firstValue_(data.airconNote, data.airconMemo, parsed.airconNote),
    area: firstValue_(data.area, data.size, parsed.area),
    homeStructure: firstValue_(data.homeStructure, data.residentialStructure, parsed.homeStructure),
    commercialShape: firstValue_(data.commercialShape, data.businessShape, parsed.commercialShape),
    workScope: firstValue_(data.workScope, data.scope, parsed.workScope),
    businessStatus: firstValue_(data.businessStatus, data.operationStatus, parsed.businessStatus),
    fixtureLevel: firstValue_(data.fixtureLevel, data.fixtures, data.furnitureLevel, parsed.fixtureLevel),
    dirtStatus: firstValue_(data.dirtStatus, data.dirt, data.contamination, parsed.dirtStatus),
    photoStatus: firstValue_(data.photoStatus, parsed.photoStatus),
    preferredSchedule: firstValue_(data.preferredSchedule, data.schedule, data.scheduleDate, parsed.preferredSchedule),
    preferredTime: firstValue_(data.preferredTime, data.scheduleTime, parsed.preferredTime),
    requestNote: firstValue_(data.requestNote, data.scheduleNote, data.note, parsed.requestNote),
    preferredContact: firstValue_(data.preferredContact, data.contact, parsed.preferredContact),
    selectedContactButton: firstValue_(data.selectedContactButton, data.contactButton),
    managerSummary: summary,
    source: firstValue_(data.source),
    leadStatus: firstValue_(data.leadStatus)
  };
}

function parseManagerSummary_(summary) {
  const text = String(summary || '');
  const parsed = {};
  if (!text) return parsed;

  const firstLine = text.split('\n').map((line) => line.trim()).find(Boolean) || '';
  if (firstLine.includes('전데렐라')) parsed.brandName = '전데렐라의 청소생각';
  if (firstLine.includes('쓰나미')) parsed.brandName = '쓰나미파워클린';

  const labelMap = {
    '접수일시': 'receivedAt',
    '주소/건물명': 'address',
    '공간 유형': 'spaceType',
    '상담 종류': 'serviceKinds',
    '에어컨 종류': 'airconTypes',
    '에어컨 대수': 'airconCount',
    '청소 이유': 'airconConcerns',
    '에어컨 추가 내용': 'airconNote',
    '평수/면적': 'area',
    '주거 구조': 'homeStructure',
    '상업 공간 형태': 'commercialShape',
    '작업 범위': 'workScope',
    '영업 상태': 'businessStatus',
    '짐/집기 여부': 'fixtureLevel',
    '오염 상태': 'dirtStatus',
    '사진': 'photoStatus',
    '희망 일정': 'preferredSchedule',
    '희망 시간대': 'preferredTime',
    '추가 요청사항': 'requestNote',
    '선호 연락 방법': 'preferredContact'
  };

  text.split('\n').forEach((line) => {
    const index = line.indexOf(':');
    if (index < 0) return;
    const label = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    const key = labelMap[label];
    if (key && normalizeValue_(value)) parsed[key] = value;
  });

  return parsed;
}

function firstValue_() {
  for (let i = 0; i < arguments.length; i += 1) {
    const value = normalizeValue_(arguments[i]);
    if (value) return value;
  }
  return '';
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

  Logger.log('TELEGRAM_TOKEN_EXISTS ' + Boolean(token));
  Logger.log('TELEGRAM_CHAT_IDS_VALUE_EXISTS ' + Boolean(chatIdsValue));

  if (!token || !chatIdsValue) {
    console.log('Telegram alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_IDS is missing');
    Logger.log('TELEGRAM_ALERT_SKIPPED missing properties');
    return { ok: false, skipped: true, message: 'missing telegram properties' };
  }

  const chatIds = chatIdsValue
    .split(',')
    .map((chatId) => chatId.trim())
    .filter(Boolean);

  Logger.log('TELEGRAM_CHAT_IDS_MASKED ' + JSON.stringify(chatIds.map(maskChatId_)));

  if (!chatIds.length) {
    console.log('Telegram alert skipped: no valid chat ids');
    Logger.log('TELEGRAM_ALERT_SKIPPED empty chat ids');
    return { ok: false, skipped: true, message: 'empty chat ids' };
  }

  const message = buildTelegramLeadMessage_(data);
  Logger.log('TELEGRAM_MESSAGE_PREVIEW ' + message.slice(0, 1000));

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
    const maskedChatId = maskChatId_(chatId);

    Logger.log('TELEGRAM_SEND_RESULT chat_id=' + maskedChatId + ' statusCode=' + statusCode);
    Logger.log('TELEGRAM_SEND_BODY chat_id=' + maskedChatId + ' body=' + body);

    results.push({ chatId: maskedChatId, statusCode, body });
    if (statusCode < 200 || statusCode >= 300) {
      console.error('Telegram sendMessage failed for chat_id=' + maskedChatId + ': ' + body);
    }
  });

  return { ok: true, results };
}

function maskChatId_(chatId) {
  const text = String(chatId || '').trim();
  if (text.length <= 6) return '***';
  return text.slice(0, 3) + '***' + text.slice(-3);
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
  pushBulletIfValue_(spaceLines, '공간 유형', data.spaceType, isTestAlert);
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
  if (lines.length && String(lines[lines.length - 1]).startsWith('* ')) {
    lines.push('');
  }
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

function testDoPostWithSamplePayload() {
  const samplePayload = buildSampleLeadPayload_();
  const fakeEvent = {
    parameter: {
      payload: JSON.stringify(samplePayload)
    },
    postData: {
      type: 'application/x-www-form-urlencoded',
      contents: 'payload=' + encodeURIComponent(JSON.stringify(samplePayload))
    }
  };
  return doPost(fakeEvent);
}

function testTelegramWithSamplePayloadDirect() {
  const samplePayload = buildSampleLeadPayload_();
  Logger.log('DIRECT_SAMPLE_RAW ' + JSON.stringify(samplePayload));
  const normalized = normalizeLeadPayload_(samplePayload);
  Logger.log('DIRECT_SAMPLE_NORMALIZED ' + JSON.stringify(normalized));
  const message = buildTelegramLeadMessage_(normalized);
  Logger.log('DIRECT_SAMPLE_MESSAGE ' + message);
  return json_(sendTelegramLeadAlert_(normalized));
}

function buildSampleLeadPayload_() {
  return {
    receivedAt: new Date().toISOString(),
    brandName: '쓰나미파워클린',
    company: 'tsunami',
    address: '공개폼 payload 확인 tsunami 2026-06-11T01:22:19.250Z',
    spaceType: '아파트',
    serviceKinds: '에어컨 분해청소, 이사청소',
    airconTypes: '벽걸이, 스탠드',
    airconCount: '2대',
    airconConcerns: '냄새가 나요, 청소한 지 오래됐어요',
    airconNote: '반려동물 있음, 쉰내 확인',
    area: '24평',
    homeStructure: '방 3개 / 욕실 2개',
    commercialShape: '',
    workScope: '전체 청소',
    businessStatus: '',
    fixtureLevel: '짐 없음',
    dirtStatus: '주방 기름때',
    photoStatus: '상담 후 별도 전송',
    preferredSchedule: '이번 주',
    preferredTime: '오후',
    requestNote: '주말 전 희망',
    preferredContact: '문자 상담',
    selectedContactButton: '문자 상담',
    managerSummary: '[쓰나미파워클린 상담 접수]\n\n접수일시: 2026. 6. 11. 오전 10:22:19\n주소/건물명: 공개폼 payload 확인 tsunami 2026-06-11T01:22:19.250Z\n공간 유형: 아파트\n상담 종류: 에어컨 분해청소, 이사청소\n에어컨 종류: 벽걸이, 스탠드\n에어컨 대수: 2대\n청소 이유: 냄새가 나요, 청소한 지 오래됐어요\n에어컨 추가 내용: 반려동물 있음, 쉰내 확인\n평수/면적: 24평\n주거 구조: 방 3개 / 욕실 2개\n상업 공간 형태: \n작업 범위: 전체 청소\n영업 상태: \n짐/집기 여부: 짐 없음\n오염 상태: 주방 기름때\n사진: 상담 후 별도 전송\n희망 일정: 이번 주\n희망 시간대: 오후\n추가 요청사항: 주말 전 희망\n선호 연락 방법: 문자 상담',
    source: 'Apps Script 내부 테스트',
    leadStatus: '테스트'
  };
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
