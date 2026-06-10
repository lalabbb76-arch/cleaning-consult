const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const settingsCode = fs.readFileSync('company-settings.js', 'utf8');
const appCode = fs.readFileSync('app.js', 'utf8');

function createContext(company = 'tsunami', fetchImpl = async () => ({ ok: true })) {
  const appState = { html: '' };
  const classSets = {};
  const context = {
    console,
    URLSearchParams,
    location: { search: `?company=${company}`, pathname: '/cleaning-consult/index.html', origin: 'https://lalabbb76-arch.github.io' },
    document: {
      documentElement: { style: { setProperty() {} } },
      title: '',
      body: { classList: { toggle() {} } },
      querySelector(selector) {
        if (selector === '#app') return { get innerHTML() { return appState.html; }, set innerHTML(value) { appState.html = value; } };
        if (selector === '#blog') return { innerHTML: '' };
        if (selector === '#modal') return { classList: { remove() {}, add() {} }, innerHTML: '' };
        if (selector === '#adminHidden') return { value: context.adminHiddenValue || '' };
        if (selector === '#admin') return { value: context.adminValue || '' };
        if (selector === '#summaryPanel') {
          if (!classSets[selector]) classSets[selector] = new Set(['hide']);
          return { classList: { toggle(cls) { classSets[selector].has(cls) ? classSets[selector].delete(cls) : classSets[selector].add(cls); } } };
        }
        return null;
      },
      querySelectorAll() { return []; }
    },
    navigator: { clipboard: { writeText: async () => undefined } },
    alert() {},
    setTimeout,
    clearTimeout,
    encodeURIComponent,
    decodeURIComponent,
    Date,
    Promise,
    fetch: fetchImpl,
    __appState: appState
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(settingsCode, context, { filename: 'company-settings.js' });
  vm.runInContext(appCode, context, { filename: 'app.js' });
  return context;
}

function setRepresentativeData(ctx, variant = 'aircon') {
  const service = variant === 'home' ? "['입주청소']" : "['에어컨 분해청소', '입주청소']";
  vm.runInContext(`
    f.address = '신길동 레이안아파트';
    f.spaceType = '${variant === 'commercial' ? '상가/매장' : '아파트'}';
    f.serviceKinds = ${service};
    f.airconTypes = ['벽걸이'];
    f.airconCount = '2대';
    f.airconConcerns = ['냄새가 나요'];
    f.airconNote = '쉰내가 나요 / 반려동물을 키워요';
    f.area = '20평대';
    f.rooms = '3개';
    f.baths = '2개';
    f.commercialShape = ['오픈형 공간'];
    f.workScope = ['전체 공간'];
    f.businessStatus = '영업 중';
    f.fixtureLevel = '일부 있음';
    f.dirt = ['창틀 먼지'];
    f.schedule = '날짜 선택';
    f.scheduleDate = '2026-06-15';
    f.scheduleTime = '9시~12시';
    f.scheduleNote = '오전 상담 원합니다';
    f.contact = '문자 상담';
  `, ctx);
}

(async () => {
  for (const company of ['zendella', 'tsunami']) {
    const ctx = createContext(company, async () => ({ ok: true }));
    vm.runInContext(`co.leadWebhookUrl = 'https://script.google.com/macros/s/example/exec';`, ctx);
    setRepresentativeData(ctx);
    const payload = ctx.buildLeadPayload('완료 화면 진입');
    assert.strictEqual(payload.company, company);
    assert.strictEqual(payload.photoStatus, '상담 후 별도 전송');
    assert.ok(payload.managerSummary.includes('에어컨 종류: 벽걸이'));
    await ctx.complete();
    const html = ctx.__appState.html;
    assert.ok(html.includes('상담 정보가 접수되었습니다.'));
    assert.ok(html.includes('전화 상담 요청하기'));
    assert.ok(html.includes('카카오톡으로 상담 이어가기'));
    assert.ok(html.includes('문자 상담하기'));
    assert.ok(html.includes('네이버 톡톡으로 상담 이어가기'));
    assert.ok(html.includes('상담 요약 보기'));
    assert.ok(!html.includes('<textarea id="admin" class="admin-visible"'));
    assert.ok(ctx.contactHref('phone').startsWith('tel:010'));
    const smsHref = ctx.contactHref('sms');
    const expectedSmsNumber = company === 'zendella' ? '01087659925' : '01046569925';
    assert.ok(smsHref.startsWith(`sms:${expectedSmsNumber}?body=`));
    const sms = decodeURIComponent(smsHref.split('body=')[1]);
    assert.ok(sms.includes('안녕하세요. 청소 상담 문의드립니다.'));
    assert.ok(sms.includes(`브랜드: ${company === 'zendella' ? '전데렐라의 청소생각' : '쓰나미파워클린'}`));
    assert.ok(sms.includes('주소/건물명: 신길동 레이안아파트'));
    assert.ok(sms.includes('공간 유형: 아파트'));
    assert.ok(sms.includes('상담 종류: 에어컨 분해청소, 입주청소'));
    assert.ok(sms.includes('에어컨 종류: 벽걸이'));
    assert.ok(sms.includes('에어컨 대수: 2대'));
    assert.ok(sms.includes('청소 이유: 냄새가 나요'));
    assert.ok(sms.includes('희망 일정: 2026년 6월 15일'));
    assert.ok(sms.includes('희망 시간대: 9시~12시'));
    assert.ok(sms.includes('사진: 상담 후 별도 전송'));
    assert.ok(sms.includes('추가 요청: 오전 상담 원합니다'));
    assert.ok(!sms.includes('에어컨 추가 내용'));
    assert.ok(!sms.includes('평수/면적'));
    assert.ok(!sms.includes('오염 상태'));
    assert.ok(sms.length <= 360, `SMS draft too long: ${sms.length}`);
    assert.ok(html.includes('문자 상담을 누르면 입력하신 상담 내용이 문자에 자동으로 들어갑니다.'));
  }

  const failCtx = createContext('tsunami', async () => { throw new Error('forced failure'); });
  vm.runInContext(`co.leadWebhookUrl = 'https://script.google.com/macros/s/example/exec';`, failCtx);
  setRepresentativeData(failCtx, 'home');
  await failCtx.complete();
  assert.ok(failCtx.__appState.html.includes('상담 정보 저장에 실패했습니다.'));
  assert.ok(failCtx.__appState.html.includes('문자 상담하기'));

  console.log('customer flow QA passed for zendella/tsunami success and failure paths');
})();
