const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const params = new URLSearchParams(location.search);
const devMode = params.get('dev') === '1';
let key = params.get('company') || location.pathname.split('/').filter(Boolean).pop() || 'zendella';
if (!companySettings[key]) key = 'zendella';
let co = companySettings[key];
let i = -1;

const AIRCON_SERVICES = ['에어컨 분해청소'];
const HOME_DETAIL_SERVICES = ['입주청소', '이사청소', '거주청소', '정기청소', '부분청소', '사무실청소', '상가청소'];
const UNKNOWN = '잘 모르겠어요';
const AIRCON_TYPES = ['벽걸이', '스탠드', '2 in 1', '시스템 1way', '시스템 4way', UNKNOWN];
const AIRCON_COUNTS = ['1대', '2대', '3대', '4대 이상', UNKNOWN];
const AIRCON_CONCERNS = ['냄새', '곰팡이', '먼지', '바람 약함', '물 떨어짐', '오래 사용함', '아기/가족 건강 때문에', UNKNOWN];

const f = {
  address: '',
  spaceType: '',
  serviceKinds: [],
  airconTypes: [],
  airconCount: '',
  airconConcerns: [],
  airconNote: '',
  area: '',
  rooms: '',
  baths: '',
  balcony: '',
  expansion: '',
  structureNote: '',
  repair: [],
  repairNote: '',
  dirt: [],
  schedule: '',
  scheduleNote: '',
  contact: ''
};

const score = {
  '냄새': 1, '곰팡이': 2, '먼지': 1, '바람 약함': 1, '물 떨어짐': 2, '오래 사용함': 1,
  '아기/가족 건강 때문에': 1, '창틀 먼지': 1, '욕실 물때': 1, '주방 기름때': 2,
  '공사먼지': 2, '부분 인테리어 후 먼지': 2, '페인트 자국/먼지': 2, '수납장 내부 먼지': 1,
  '반려동물 털': 1, '짐이 있어요': 2
};

function selectedServices() {
  return f.serviceKinds || [];
}

function serviceText() {
  return selectedServices().join(', ') || '미입력';
}

function hasAirconService() {
  return selectedServices().some((item) => AIRCON_SERVICES.includes(item));
}

function hasHomeDetailService() {
  const selected = selectedServices();
  if (selected.length === 0 || selected.includes(UNKNOWN)) return true;
  return selected.some((item) => HOME_DETAIL_SERVICES.includes(item));
}

function isAirconOnly() {
  const selected = selectedServices();
  return selected.length > 0 && selected.every((item) => AIRCON_SERVICES.includes(item));
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function escapeJs(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function theme() {
  document.documentElement.style.setProperty('--main', co.mainColor);
  document.documentElement.style.setProperty('--sub', co.subColor);
  document.documentElement.style.setProperty('--btn', co.buttonColor);
  document.title = `${co.companyName} 상담 링크`;
  document.body.classList.toggle('dev-mode', devMode);
  document.body.classList.toggle('customer-mode', !devMode);
  $$('[data-co]').forEach((button) => button.classList.toggle('on', button.dataset.co === key));
}

function logo() {
  return `<div class="logo">${co.logoText || co.companyName[0]}</div>`;
}

function servicePills() {
  return ['에어컨 분해청소', '입주청소', '이사청소', '거주청소', '정기청소']
    .map((item) => `<span>${item}</span>`).join('');
}

function init() {
  theme();
  hero();
  blog();
}

function hero() {
  $('#app').innerHTML = `
    <div class="brand hero-brand">${logo()}<div><b>${co.companyName}</b><br><small>${co.toneLabel}</small></div></div>
    <div class="hero-kicker">안심되는 프리미엄 홈케어 상담</div>
    <h1>${co.startTitle}</h1>
    <p class="hero-copy">${co.heroBody.replace(/\n/g, '<br>')}</p>
    <div class="hero-art">
      <div class="air-flow" aria-hidden="true"></div>
      <div class="service-pills">${servicePills()}</div>
      <div class="trust-panel">
        <div><b>1~2분 접수</b><span>주소와 기본 정보만 간편하게</span></div>
        <div><b>사진은 상담 후</b><span>페이지에 직접 저장하지 않습니다</span></div>
        <div><b>상담 방법 선택</b><span>전화, 문자, 톡톡으로 부담 없이 상담</span></div>
      </div>
    </div>
    <button class="primary full hero-btn" onclick="start()">상담 시작하기</button>
    <p class="micro-copy">전화가 부담되면 문자나 톡톡으로도 천천히 남기실 수 있습니다.</p>`;
}

function blog() {
  $('#blog').innerHTML = `
    <div class="brand cta-brand">${logo()}<div><b>${co.companyName}</b><br><small>상담 링크 안내</small></div></div>
    <div class="cta-chip">에어컨 · 입주 · 이사 통합 상담</div>
    <h2>${co.blogCtaTitle}</h2>
    <p>${co.blogCtaBody.replace(/\n/g, '<br>')}</p>
    <div class="cta-mini-list">
      <span>상담 범위 정리</span>
      <span>예산 확인 준비</span>
      <span>사진은 상담 후 전송</span>
    </div>
    <button class="primary full" onclick="start()">${co.blogCtaButton}</button>
    <p><small>전화, 카카오톡, 문자, 네이버 톡톡으로 이어서 상담할 수 있습니다.</small></p>`;
}

function start() {
  i = 0;
  render();
}

function steps() {
  const base = ['address', 'space', 'service'];
  if (hasAirconService()) base.push('aircon');
  if (hasHomeDetailService()) base.push('area', 'home', 'repair', 'dirt');
  base.push('photos', 'schedule', 'contact', 'complete');
  return base;
}

function normalizeCurrentStep() {
  const currentSteps = steps();
  if (i >= currentSteps.length) i = currentSteps.length - 1;
}

function progress() {
  const visibleSteps = steps().filter((step) => step !== 'complete');
  const current = Math.min(i + 1, visibleSteps.length);
  return `
    <div class="topbar">
      <button class="back" onclick="prev()">‹</button>
      <div class="progress"><b>상담 정보 입력 중 ${current} / ${visibleSteps.length}</b><span style="width:${Math.min((current / visibleSteps.length) * 100, 100)}%"></span></div>
    </div>`;
}

function layout(title, body, footer = '') {
  $('#app').innerHTML = `<div class="step-brand">${logo()}<div><b>${co.companyName}</b><small>${co.toneLabel}</small></div></div>${progress()}<section class="step"><h1>${title}</h1>${body}</section><div class="nav">${footer || '<button class="ghost skip" onclick="next()">건너뛰기</button><button class="primary next" onclick="next()">다음</button>'}</div>`;
}

function chips(field, options, multi = false, extraClass = '') {
  const values = multi ? f[field] : [f[field]];
  return `<div class="chips ${extraClass}">${options.map((option) => {
    const selected = values.includes(option);
    const check = selected ? '<span class="checkmark">✓</span>' : '';
    return `<button class="chip ${selected ? 'sel' : ''}" onclick="${multi ? `tog('${field}','${escapeJs(option)}')` : `sel('${field}','${escapeJs(option)}')`}">${check}${option}</button>`;
  }).join('')}</div>`;
}

function render() {
  normalizeCurrentStep();
  const step = steps()[i];
  if (step === 'address') {
    layout('청소할 곳의 주소나 건물명을 알려주세요.', `
      <p>정확한 동·호수는 입력하지 않으셔도 됩니다.<br>동네명이나 건물명만으로도 상담을 시작할 수 있습니다.</p>
      <input value="${escapeHtml(f.address)}" oninput="f.address=this.value" placeholder="예: 신길동 레이안아파트">
      <div class="hint">상세 주소는 상담이 확정된 뒤 알려주셔도 괜찮습니다.</div>`);
  }
  if (step === 'space') {
    layout('어떤 공간 상담이 필요하신가요?', chips('spaceType', co.spaceTypes));
  }
  if (step === 'service') {
    layout('어떤 청소가 필요하신가요?', `
      <p>대표 서비스를 모두 선택해주세요.<br>에어컨 청소와 입주·이사청소를 함께 상담받으실 수도 있습니다.</p>
      ${chips('serviceKinds', co.serviceKinds, true, 'service-chips')}
      <div class="hint">부분청소, 사무실청소, 상가청소처럼 추가 상담이 필요하면 뒤 단계의 메모나 전화 상담에서 함께 말씀해주셔도 됩니다.</div>`);
  }
  if (step === 'aircon') {
    layout('에어컨 정보를 알려주세요.', `
      <p>정확히 모르셔도 괜찮습니다.<br>아는 부분만 선택해주시면 상담에 도움이 됩니다.</p>
      <h3>에어컨 종류</h3>${chips('airconTypes', AIRCON_TYPES, true)}
      <h3>청소할 에어컨은 몇 대인가요?</h3>${chips('airconCount', AIRCON_COUNTS)}
      <h3>걱정되는 부분</h3>${chips('airconConcerns', AIRCON_CONCERNS, true)}
      <textarea oninput="f.airconNote=this.value" placeholder="예: 거실 스탠드 1대 + 안방 벽걸이 1대 / 2 in 1 1세트 / 시스템 1way 2대 / 냄새가 심해요">${escapeHtml(f.airconNote)}</textarea>`);
  }
  if (step === 'area') {
    const optional = hasAirconService() ? '<div class="hint">에어컨 청소와 함께 상담받는 경우, 평수는 대략만 선택하셔도 괜찮습니다.</div>' : '';
    layout(co.areaTitle, `<p>정확하지 않아도 괜찮습니다. 비슷한 크기를 선택해주세요.</p>${chips('area', co.areaOptions)}${optional}`);
  }
  if (step === 'home') {
    layout('구조를 알고 계시면 선택해주세요.', `
      <p>방, 욕실, 베란다 개수를 알려주시면 상담에 도움이 됩니다.</p>
      <h3>방은 몇 개인가요?</h3>${chips('rooms', ['1개', '2개', '3개', '4개 이상', UNKNOWN])}
      <h3>욕실은 몇 개인가요?</h3>${chips('baths', ['1개', '2개', '3개 이상', UNKNOWN])}
      <h3>베란다나 다용도실이 있나요?</h3>${chips('balcony', ['없음', '1개', '2개 이상', UNKNOWN])}
      <h3>확장된 공간이 있나요?</h3>${chips('expansion', ['확장형', '비확장형', '일부 확장', UNKNOWN])}
      <textarea oninput="f.structureNote=this.value" placeholder="예: 방3, 욕실2, 베란다1 / 거실 확장형">${escapeHtml(f.structureNote)}</textarea>`);
  }
  if (step === 'repair') {
    layout('최근 수리나 인테리어 작업이 있었나요?', `
      <p>공사 후 먼지, 페인트 자국, 마감 잔여물 확인에 도움이 됩니다.</p>
      ${chips('repair', ['없어요', '전체 인테리어', '부분 인테리어', '도배/장판', '페인트', '주방', '욕실', '필름/문/몰딩', '기타', UNKNOWN], true)}
      <textarea oninput="f.repairNote=this.value" placeholder="예: 주방만 교체했어요 / 페인트 작업을 했어요">${escapeHtml(f.repairNote)}</textarea>`);
  }
  if (step === 'dirt') {
    layout(co.dirtTitle, `
      <p>여러 개 선택하셔도 괜찮습니다. 청소 오염 상태를 선택해주세요.</p>
      ${chips('dirt', co.dirtOptions, true)}
      <div class="hint">오염 상태는 평가가 아니라 작업 범위와 예산을 확인하기 위한 자료입니다.</div>`);
  }
  if (step === 'photos') {
    layout('사진이 있으시면 상담 후 이어서 보내주세요.', `
      <p>사진이 있으면 더 정확한 상담이 가능합니다.</p>
      <p>현재 페이지에서는 사진을 직접 저장하지 않습니다.<br>상담 내용을 먼저 남겨주신 뒤, 전화 상담 후 안내받은 번호나 카카오톡, 문자, 네이버 톡톡으로 사진을 보내주세요.</p>
      <div class="hint">사진은 예쁘게 찍지 않으셔도 괜찮습니다. 전체 구조와 걱정되는 부분이 보이면 충분합니다.</div>
      <div class="upload notice-upload"><b>사진은 상담 후 별도 전송</b><br>현재 페이지에서는 사진을 직접 저장하지 않습니다.<br>전화 상담 후 안내받은 번호나 카카오톡, 문자, 네이버 톡톡으로 보내주세요.</div>
      <div class="upload-actions">
        <button class="ghost" onclick="examples()">사진 예시 보기</button>
        <button class="secondary" onclick="photoInfo()">상담 후 사진 보내기</button>
      </div>`,
      `<button class="ghost skip" onclick="prev()">이전</button><button class="primary next" onclick="next()">다음으로 넘어가기</button>`);
  }
  if (step === 'schedule') {
    layout('희망하시는 작업 일정이 있으신가요?', `
      ${chips('schedule', ['이번 주', '다음 주', '날짜 선택', '아직 미정'])}
      <textarea oninput="f.scheduleNote=this.value" placeholder="예: 오전이면 좋아요 / 주말 상담 원합니다">${escapeHtml(f.scheduleNote)}</textarea>`);
  }
  if (step === 'contact') {
    layout('상담을 이어받을 방법을 선택해주세요.', `
      <p>현장 작업 중에는 전화 상담이 가장 빠릅니다.<br>통화가 어려우시면 카카오톡이나 문자로 남겨주세요.<br>네이버 톡톡은 확인이 늦을 수 있습니다.</p>
      <div class="contact-choices">
        <button class="contact-chip phone ${f.contact === '전화 상담' ? 'sel' : ''}" onclick="sel('contact','전화 상담')">전화 상담</button>
        <button class="contact-chip kakao ${f.contact === '카카오톡 상담' ? 'sel' : ''}" onclick="sel('contact','카카오톡 상담')">카카오톡 상담</button>
        <button class="contact-chip ${f.contact === '문자 상담' ? 'sel' : ''}" onclick="sel('contact','문자 상담')">문자 상담</button>
        <button class="contact-chip ${f.contact === '네이버 톡톡 상담' ? 'sel' : ''}" onclick="sel('contact','네이버 톡톡 상담')">네이버 톡톡 상담</button>
      </div>
      <div class="quick-contact">
        <a class="quick-contact-main" href="${contactHref('phone')}" onclick="f.contact='전화 상담'">바로 전화 상담하기</a>
        <a href="${contactHref('kakao') || '#'}" class="${contactHref('kakao') ? '' : 'disabled'}" onclick="f.contact='카카오톡 상담'">카카오톡 상담</a>
        <a href="${contactHref('sms')}" onclick="f.contact='문자 상담'">문자 상담</a>
        <a href="${contactHref('naver') || '#'}" class="${contactHref('naver') ? '' : 'disabled'}" onclick="f.contact='네이버 톡톡 상담'">네이버 톡톡</a>
      </div>
      <div class="hint">사진은 상담 후 카카오톡이나 문자로 보내주시면 더 정확히 안내드릴 수 있습니다.</div>`);
  }
  if (step === 'complete') complete();
}

function sel(field, value) {
  f[field] = value;
  render();
}

function tog(field, value) {
  const arr = f[field];
  const idx = arr.indexOf(value);
  if (value === UNKNOWN) {
    f[field] = idx >= 0 ? [] : [UNKNOWN];
  } else {
    const unknownIdx = arr.indexOf(UNKNOWN);
    if (unknownIdx >= 0) arr.splice(unknownIdx, 1);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
  }
  if (field === 'serviceKinds' && !hasAirconService()) {
    f.airconTypes = [];
    f.airconCount = '';
    f.airconConcerns = [];
    f.airconNote = '';
  }
  render();
}

function next() {
  if (i < steps().length - 1) {
    i += 1;
    render();
  }
}

function prev() {
  if (i > 0) {
    i -= 1;
    render();
  } else {
    hero();
  }
}

function showModal(title, body) {
  $('#modal').classList.remove('hide');
  $('#modal').innerHTML = `<div class="modal-card"><h2>${title}</h2>${body}<button class="primary full" onclick="closeModal()">확인했어요</button></div>`;
}

function closeModal() {
  $('#modal').classList.add('hide');
}

function examples() {
  const aircon = co.photoGuide.slice(0, 5).map((guide, idx) => `<li><b>${idx + 1}. ${guide[0]}</b><br>${guide[1]}</li>`).join('');
  const home = co.photoGuide.slice(5).map((guide, idx) => `<li><b>${idx + 1}. ${guide[0]}</b><br>${guide[1]}</li>`).join('');
  showModal('사진 예시 보기', `<div class="important-photo">모델명/제품 스티커가 가장 중요합니다.</div><h3>에어컨 분해청소 사진 예시</h3><ol>${aircon}</ol><h3>입주청소/이사청소 사진 예시</h3><ol>${home}</ol>`);
}

function photoInfo() {
  showModal('사진은 상담 후 보내주시면 됩니다.', `
    <p>현재 페이지에서는 사진을 직접 저장하지 않습니다.<br>상담 접수 후 전화, 카카오톡, 문자, 네이버 톡톡 중 편한 방법으로 사진을 보내주세요.</p>
    <p>가장 빠른 상담은 전화입니다.<br>통화가 어려우시면 카카오톡이나 문자로 남겨주세요.</p>`);
}

function risk() {
  const total = [...f.dirt, ...f.airconConcerns].reduce((sum, item) => sum + (score[item] || 0), 0);
  return total >= 5 ? '높음' : total >= 3 ? '중간' : total > 0 ? '낮음' : '확인 필요';
}

function homeStructure() {
  const parts = [];
  if (f.rooms) parts.push(`방 ${f.rooms}`);
  if (f.baths) parts.push(`욕실 ${f.baths}`);
  if (f.balcony) parts.push(`베란다 ${f.balcony}`);
  if (f.expansion) parts.push(f.expansion);
  return parts.join(' / ') || '미입력';
}

function airconRows() {
  if (!hasAirconService()) return [];
  return [
    ['에어컨 종류', f.airconTypes.join(', ') || '미입력'],
    ['에어컨 대수', f.airconCount],
    ['걱정되는 부분', f.airconConcerns.join(', ') || '미입력'],
    ['에어컨 추가 내용', f.airconNote || '미입력']
  ];
}

function summaryRows() {
  const rows = [
    ['공간 유형', f.spaceType],
    ['상담 종류', serviceText()],
    ...airconRows()
  ];
  if (hasHomeDetailService()) {
    rows.push(
      ['평수/구조', `${f.area || '미입력'} / ${homeStructure()}`],
      ['수리 여부', f.repair.join(', ') || '미입력'],
      ['오염 상태', f.dirt.join(', ') || '미입력']
    );
  }
  rows.push(['사진', '상담 후 별도 전송'], ['희망 일정', f.schedule]);
  return rows;
}

function adminText() {
  const airconBlock = hasAirconService()
    ? `에어컨 종류: ${f.airconTypes.join(', ')}\n에어컨 대수: ${f.airconCount || ''}\n에어컨 걱정 부분: ${f.airconConcerns.join(', ')}\n추가 내용: ${f.airconNote || ''}\n`
    : '';
  const homeBlock = hasHomeDetailService()
    ? `평수: ${f.area || ''}\n구조: ${homeStructure()}\n수리 여부: ${f.repair.join(', ')}\n오염 상태: ${f.dirt.join(', ')}\n`
    : '';
  return `[${co.adminSummaryTitle}]\n\n주소/건물명: ${f.address || ''}\n공간 유형: ${f.spaceType || ''}\n상담 종류: ${serviceText()}\n${airconBlock}${homeBlock}사진: 상담 후 별도 전송\n희망 일정: ${f.schedule || ''}\n선호 연락 방법: ${f.contact || ''}\n추가 요청: ${[f.airconNote, f.structureNote, f.repairNote, f.scheduleNote].filter(Boolean).join(' / ')}\n\n내부 확인 필요도: ${risk()}`;
}

function digits(value) {
  return String(value || '').replace(/[^0-9+]/g, '');
}

function contactHref(type) {
  const phone = digits(co.phoneNumber);
  const sms = digits(co.smsNumber || co.phoneNumber);
  const smsBody = encodeURIComponent(`안녕하세요. ${co.companyName} 청소 상담 문의드립니다.`);
  if (type === 'phone') return phone ? `tel:${phone}` : '';
  if (type === 'sms') return sms ? `sms:${sms}?body=${smsBody}` : '';
  if (type === 'kakao') return co.kakaoChannelLink || '';
  if (type === 'naver') return co.naverTalkLink || '';
  return '';
}

function linkButton(label, href, className = '') {
  const disabled = !href;
  const targetAttr = href && !href.startsWith('tel:') && !href.startsWith('sms:') ? ' target="_blank" rel="noopener"' : '';
  return `<a class="action ${className} ${disabled ? 'disabled' : ''}" href="${href || '#'}"${targetAttr}>${label}</a>`;
}

function complete() {
  const rows = summaryRows().map(([label, value]) => `<div><b>${label}</b><span>${value || '미입력'}</span></div>`).join('');
  const admin = adminText();
  $('#app').innerHTML = `
    <div class="brand">${logo()}<div><b>${co.companyName}</b><br><small>상담 접수 완료</small></div></div>
    <section class="complete">
      <h1>${co.completeTitle}</h1>
      <p>${co.completeBody}</p>
      <div class="hint strong-hint">상담 내용이 정리되었습니다.<br>선택하신 상담 종류를 기준으로 담당자가 확인합니다.<br>사진이 있으면 더 정확한 상담이 가능합니다.</div>
      <h2>입력하신 내용</h2>
      <div class="summary">${rows}</div>
      <div class="actions">
        ${linkButton('전화 상담 요청하기', contactHref('phone'), 'primary-action phone-action')}
        ${linkButton('카카오톡으로 상담 이어가기', contactHref('kakao'), 'secondary-action kakao-action')}
        ${linkButton('문자 상담하기', contactHref('sms'), 'secondary-action')}
        ${linkButton('네이버 톡톡으로 상담 이어가기', contactHref('naver'), 'secondary-action')}
      </div>
      <h2>상담 요약</h2>
      <button class="ghost copy-button" onclick="copy()">상담 내용 복사하기</button>
      <textarea id="admin" readonly>${admin}</textarea>
      <p><small>담당자가 확인 후 안내드립니다. 추가 사진이나 요청사항은 전화 상담 후 안내받은 번호, 카카오톡, 문자 또는 네이버 톡톡으로 보내주세요.</small></p>
    </section>`;
}

function copy() {
  navigator.clipboard.writeText($('#admin').value).then(() => alert('상담 요약을 복사했습니다.'));
}

function switchCompany(nextKey) {
  const suffix = devMode ? '&dev=1' : '';
  location.href = `${location.pathname}?company=${nextKey}${suffix}`;
}

$$('[data-co]').forEach((button) => {
  button.addEventListener('click', () => switchCompany(button.dataset.co));
});

init();
