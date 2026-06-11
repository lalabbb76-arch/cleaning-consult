const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const settingsCode = fs.readFileSync('company-settings.js', 'utf8');
const appCode = fs.readFileSync('app.js', 'utf8');

function createContext(company = 'tsunami') {
  const appState = { html: '' };
  const context = {
    console,
    URLSearchParams,
    location: { search: `?company=${company}`, pathname: '/cleaning-consult/', origin: 'https://lalabbb76-arch.github.io' },
    document: {
      documentElement: { style: { setProperty() {} } },
      title: '',
      body: { classList: { toggle() {} } },
      querySelector(selector) {
        if (selector === '#app') return { get innerHTML() { return appState.html; }, set innerHTML(value) { appState.html = value; } };
        if (selector === '#blog') return { innerHTML: '' };
        if (selector === '#modal') return { classList: { remove() {}, add() {} }, innerHTML: '' };
        if (selector === '#admin') return { value: context.adminValue || '' };
        return null;
      },
      querySelectorAll() { return []; }
    },
    navigator: { clipboard: { writeText: async () => undefined } },
    alert() {},
    setTimeout,
    clearTimeout,
    encodeURIComponent,
    Date,
    Promise,
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    __appState: appState
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(settingsCode, context, { filename: 'company-settings.js' });
  vm.runInContext(appCode, context, { filename: 'app.js' });
  return context;
}

async function testLeadPayloadColumns() {
  const ctx = createContext('tsunami');
  assert.strictEqual(typeof ctx.buildLeadPayload, 'function', 'buildLeadPayload function should exist');
  vm.runInContext(`
    f.address = '신길동 레이안아파트';
    f.spaceType = '아파트';
    f.serviceKinds = ['에어컨 분해청소', '입주청소'];
    f.airconTypes = ['벽걸이'];
    f.airconCount = '2대';
    f.airconConcerns = ['냄새가 나요'];
    f.airconNote = '쉰내가 나요 / 반려동물을 키워요';
    f.area = '20평대';
    f.rooms = '3개';
    f.baths = '2개';
    f.dirt = ['창틀 먼지'];
    f.schedule = '날짜 선택';
    f.scheduleDate = '2026-06-15';
    f.scheduleTime = '9시~12시';
    f.scheduleNote = '오전 상담 원합니다';
    f.contact = '문자 상담';
  `, ctx);
  const payload = ctx.buildLeadPayload('문자 상담');

  assert.strictEqual(payload.brandName, '쓰나미파워클린');
  assert.strictEqual(payload.company, 'tsunami');
  assert.strictEqual(payload.photoStatus, '상담 후 별도 전송');
  assert.strictEqual(payload.leadStatus, '신규 접수');
  assert.strictEqual(payload.selectedContactButton, '문자 상담');
  assert.ok(payload.managerSummary.includes('[쓰나미파워클린 상담 접수]'));
  assert.ok(payload.managerSummary.includes('에어컨 종류: 벽걸이'));
  assert.ok(payload.managerSummary.includes('사진: 상담 후 별도 전송'));
}

function testSmsDraft() {
  const ctx = createContext('zendella');
  assert.strictEqual(typeof ctx.smsDraftText, 'function', 'smsDraftText function should exist');
  vm.runInContext(`
    f.address = '신길동 레이안아파트';
    f.spaceType = '오피스텔';
    f.serviceKinds = ['에어컨 분해청소'];
    f.airconTypes = ['스탠드'];
    f.airconCount = '1대';
    f.airconConcerns = ['곰팡이가 보여요'];
    f.airconNote = '곰팡이 냄새가 나요';
    f.schedule = '이번 주';
    f.scheduleTime = '12시~3시';
  `, ctx);
  const draft = ctx.smsDraftText();
  assert.ok(draft.startsWith('안녕하세요. 청소 상담 문의드립니다.'));
  assert.ok(draft.includes('브랜드: 전데렐라의 청소생각'));
  assert.ok(draft.includes('사진: 상담 후 별도 전송'));
  assert.ok(ctx.contactHref('sms').startsWith('sms:01087659925?body='));
  assert.ok(decodeURIComponent(ctx.contactHref('sms').split('body=')[1]).includes('상담 종류: 에어컨 분해청소'));
}

async function testCompleteSuccessAndFailureUi() {
  const successCtx = createContext('tsunami');
  vm.runInContext(`co.leadWebhookUrl = 'https://script.google.com/macros/s/example/exec';`, successCtx);
  successCtx.fetch = async (url, options) => {
    assert.strictEqual(url, 'https://script.google.com/macros/s/example/exec');
    assert.strictEqual(options.headers['Content-Type'], 'application/x-www-form-urlencoded;charset=UTF-8');
    const params = new URLSearchParams(options.body);
    const payload = JSON.parse(params.get('payload'));
    assert.strictEqual(payload.brandName, '쓰나미파워클린');
    assert.ok(payload.managerSummary.includes('상담 종류:'));
    assert.ok(Object.prototype.hasOwnProperty.call(payload, 'address'));
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await successCtx.complete();
  assert.ok(successCtx.__appState.html.includes('상담 정보가 접수되었습니다.'));
  assert.ok(successCtx.__appState.html.includes('전화 상담 요청하기'));
  assert.ok(!successCtx.__appState.html.includes('<textarea id="admin" class="admin-visible"'));

  const beaconCtx = createContext('zendella');
  vm.runInContext(`co.leadWebhookUrl = 'https://script.google.com/macros/s/example/exec';`, beaconCtx);
  let beaconUrl = '';
  beaconCtx.Blob = class Blob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  };
  beaconCtx.navigator.sendBeacon = (url, blob) => {
    beaconUrl = url;
    const params = new URLSearchParams(blob.parts[0]);
    const payload = JSON.parse(params.get('payload'));
    assert.strictEqual(payload.brandName, '전데렐라의 청소생각');
    assert.strictEqual(blob.options.type, 'application/x-www-form-urlencoded;charset=UTF-8');
    return true;
  };
  beaconCtx.fetch = async () => { throw new Error('network failed before beacon fallback'); };
  await beaconCtx.complete();
  assert.strictEqual(beaconUrl, 'https://script.google.com/macros/s/example/exec');
  assert.ok(beaconCtx.__appState.html.includes('상담 정보가 접수되었습니다.'));

  const failCtx = createContext('tsunami');
  vm.runInContext(`co.leadWebhookUrl = 'https://script.google.com/macros/s/example/exec';`, failCtx);
  failCtx.fetch = async () => { throw new Error('network failed'); };
  await failCtx.complete();
  assert.ok(failCtx.__appState.html.includes('상담 정보 저장에 실패했습니다.'));
  assert.ok(failCtx.__appState.html.includes('문자 상담하기'));
}

(async () => {
  await testLeadPayloadColumns();
  testSmsDraft();
  await testCompleteSuccessAndFailureUi();
  console.log('lead webhook tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
