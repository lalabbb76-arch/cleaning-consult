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
