const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const params = new URLSearchParams(location.search);
const devMode = params.get('dev') === '1';
let key = params.get('company') || location.pathname.split('/').filter(Boolean).pop() || 'zendella';
if (!companySettings[key]) key = 'zendella';
let co = companySettings[key];
let i = -1;

const AIRCON_SERVICES = ['에어컨 분해청소', '벽걸이 에어컨 청소', '스탠드 에어컨 청소', '시스템 에어컨 청소'];
const AIRCON_TYPES = ['벽걸이', '스탠드', '2 in 1', '시스템 1way', '시스템 4way', '천장형', '잘 모르겠어요'];
const AIRCON_COUNTS = ['1대', '2대', '3대', '4대 이상', '잘 모르겠어요'];
const AIRCON_CONCERNS = ['냄새', '곰팡이', '먼지', '바람 약함', '물 떨어짐', '오래 사용함', '아기/가족 건강 때문에', '잘 모르겠어요'];

const f = {
  address: '',
  spaceType: '',
  serviceKind: '',
  airconType: '',
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
  '반려동물 털': 1
};

function isAirconService() {
  return AIRCON_SERVICES.includes(f.serviceKind);
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

function init() {
  theme();
  hero();
  blog();
}

function hero() {
  $('#app').innerHTML = `
    <div class="brand hero-brand">${logo()}<div><b>${co.companyName}</b><br><small>${co.toneLabel}</small></div></div>
    <div class="hero-art"><div class="hero-badge">AIRCON<br>CLEAN</div><div class="fake"><div class="line w70"></div><div class="line"></div><div class="line w45"></div></div></div>
    <h1>${co.startTitle}</h1>
    <p>${co.heroBody.replace(/\n/g, '<br>')}</p>
    <button class="primary full hero-btn" onclick="start()">상담 시작하기</button>`;
}

function blog() {
  $('#blog').innerHTML = `
    <div class="brand">${logo()}<div><b>블로그 삽입용 CTA</b><br><small>${co.companyName}</small></div></div>
    <h2>${co.blogCtaTitle}</h2>
    <p>${co.blogCtaBody}</p>
    <button class="primary full" onclick="start()">${co.blogCtaButton}</button>
    <p><small>블로그, QR코드, 문자, 카카오톡, 네이버 플레이스에 연결할 수 있습니다.</small></p>`;
}

function start() {
  i = 0;
  render();
}

function steps() {
  const base = ['address', 'space', 'service'];
  if (isAirconService()) base.push('aircon');
  base.push('area', 'home', 'repair', 'dirt', 'photos', 'schedule', 'contact', 'complete');
  return base;
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
  $('#app').innerHTML = `${progress()}<section class="step"><h1>${title}</h1>${body}</section><div class="nav">${footer || '<button class="ghost" onclick="next()">건너뛰기</button><button class="primary" onclick="next()">다음</button>'}</div>`;
}

function chips(field, options, multi = false, extraClass = '') {
  const values = multi ? f[field] : [f[field]];
  return `<div class="chips ${extraClass}">${options.map((option) => `<button class="chip ${values.includes(option) ? 'sel' : ''}" onclick="${multi ? `tog('${field}','${escapeJs(option)}')` : `sel('${field}','${escapeJs(option)}')`}">${option}</button>`).join('')}</div>`;
}

function render() {
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
      <p>4월부터 10월은 에어컨 분해청소 문의가 많습니다. 해당되시면 가장 앞쪽 항목을 선택해주세요.</p>
      ${chips('serviceKind', co.serviceKinds, false, 'service-chips')}
      <div class="hint">정확히 모르셔도 괜찮습니다. 상담 내용을 보고 필요한 범위를 함께 확인해드립니다.</div>`);
  }
  if (step === 'aircon') {
    layout('에어컨 정보를 알려주세요.', `
      <p>에어컨 종류와 대수를 알면 상담이 훨씬 빨라집니다.</p>
      <h3>어떤 에어컨인가요?</h3>${chips('airconType', AIRCON_TYPES)}
      <h3>청소할 에어컨은 몇 대인가요?</h3>${chips('airconCount', AIRCON_COUNTS)}
      <h3>어떤 점이 걱정되시나요?</h3>${chips('airconConcerns', AIRCON_CONCERNS, true)}
      <textarea oninput="f.airconNote=this.value" placeholder="예: 거실 스탠드 1대, 안방 벽걸이 1대 / 2 in 1 / 시스템 에어컨 4대 / 냄새가 심해요">${escapeHtml(f.airconNote)}</textarea>`);
  }
  if (step === 'area') {
    layout(co.areaTitle, `<p>정확하지 않아도 괜찮습니다. 비슷한 크기를 선택해주세요.</p>${chips('area', co.areaOptions)}`);
  }
  if (step === 'home') {
    layout('구조를 알고 계시면 선택해주세요.', `
      <p>방, 욕실, 베란다 개수를 알려주시면 상담에 도움이 됩니다.</p>
      <h3>방은 몇 개인가요?</h3>${chips('rooms', ['1개', '2개', '3개', '4개 이상', '잘 모르겠어요'])}
      <h3>욕실은 몇 개인가요?</h3>${chips('baths', ['1개', '2개', '3개 이상', '잘 모르겠어요'])}
      <h3>베란다나 다용도실이 있나요?</h3>${chips('balcony', ['없음', '1개', '2개 이상', '잘 모르겠어요'])}
      <h3>확장된 공간이 있나요?</h3>${chips('expansion', ['확장형', '비확장형', '일부 확장', '잘 모르겠어요'])}
      <textarea oninput="f.structureNote=this.value" placeholder="예: 방3, 욕실2, 베란다1 / 거실 확장형">${escapeHtml(f.structureNote)}</textarea>`);
  }
  if (step === 'repair') {
    layout('최근 수리나 인테리어 작업이 있었나요?', `
      <p>공사 후 먼지, 페인트 자국, 마감 잔여물 확인에 도움이 됩니다.</p>
      ${chips('repair', ['없어요', '전체 인테리어', '부분 인테리어', '도배/장판', '페인트', '주방', '욕실', '필름/문/몰딩', '기타', '잘 모르겠어요'], true)}
      <textarea oninput="f.repairNote=this.value" placeholder="예: 주방만 교체했어요 / 페인트 작업을 했어요">${escapeHtml(f.repairNote)}</textarea>`);
  }
  if (step === 'dirt') {
    layout(co.dirtTitle, `
      <p>여러 개 선택하셔도 괜찮습니다. 에어컨 증상이나 청소 오염 상태를 선택해주세요.</p>
      ${chips('dirt', co.dirtOptions, true)}
      <div class="hint">오염 상태는 평가가 아니라 작업 범위와 예산을 확인하기 위한 자료입니다.</div>`);
  }
  if (step === 'photos') {
    layout('사진이 있으시면 상담 후 이어서 보내주세요.', `
      <p>사진이 있으면 더 정확한 상담이 가능합니다.</p>
      <p>현재 페이지에서는 사진을 직접 저장하지 않습니다.<br>상담 내용을 먼저 남겨주신 뒤, 전화 상담 후 안내받은 번호나 카카오톡, 문자, 네이버 톡톡으로 사진을 보내주세요.</p>
      <div class="hint">사진은 예쁘게 찍지 않으셔도 괜찮습니다. 전체 구조와 걱정되는 부분이 보이면 충분합니다.</div>
      <div class="upload notice-upload"><b>사진은 이 페이지에 저장되지 않습니다.</b><br>상담 접수 후 편한 방법으로 이어서 보내주세요.</div>
      <div class="upload-actions">
        <button class="ghost" onclick="examples()">사진 예시 보기</button>
        <button class="secondary" onclick="photoInfo()">상담 후 사진 보내기</button>
      </div>`,
      `<button class="ghost" onclick="prev()">이전</button><button class="primary" onclick="next()">다음으로 넘어가기</button>`);
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
      <div class="hint">사진은 상담 후 카카오톡이나 문자로 보내주시면 더 정확히 안내드릴 수 있습니다.</div>`);
  }
  if (step === 'complete') complete();
}

function sel(field, value) {
  f[field] = value;
  if (field === 'serviceKind' && !isAirconService()) {
    f.airconType = '';
    f.airconCount = '';
    f.airconConcerns = [];
    f.airconNote = '';
  }
  render();
}

function tog(field, value) {
  const arr = f[field];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(value);
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
  showModal('사진 예시 보기', `<h3>에어컨 분해청소 사진 예시</h3><ol>${aircon}</ol><h3>입주청소/이사청소 사진 예시</h3><ol>${home}</ol>`);
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
  if (!isAirconService()) return [];
  return [
    ['에어컨 종류', f.airconType],
    ['에어컨 대수', f.airconCount],
    ['증상/걱정되는 부분', f.airconConcerns.join(', ') || '미입력']
  ];
}

function summaryRows() {
  return [
    ['공간 유형', f.spaceType],
    ['상담 종류', f.serviceKind],
    ...airconRows(),
    ['평수/구조', `${f.area || '미입력'} / ${homeStructure()}`],
    ['수리 여부', f.repair.join(', ') || '미입력'],
    ['오염 상태', f.dirt.join(', ') || '미입력'],
    ['사진', '상담 후 별도 전송'],
    ['희망 일정', f.schedule]
  ];
}

function adminText() {
  const airconBlock = isAirconService()
    ? `에어컨 종류: ${f.airconType || ''}\n에어컨 대수: ${f.airconCount || ''}\n증상/걱정되는 부분: ${f.airconConcerns.join(', ')}\n`
    : '';
  return `[${co.adminSummaryTitle}]\n\n주소/건물명: ${f.address || ''}\n공간 유형: ${f.spaceType || ''}\n상담 종류: ${f.serviceKind || ''}\n${airconBlock}평수: ${f.area || ''}\n구조: ${homeStructure()}\n수리 여부: ${f.repair.join(', ')}\n오염 상태: ${f.dirt.join(', ')}\n사진: 상담 후 별도 전송\n희망 일정: ${f.schedule || ''}\n선호 연락 방법: ${f.contact || ''}\n추가 요청: ${[f.airconNote, f.structureNote, f.repairNote, f.scheduleNote].filter(Boolean).join(' / ')}\n\n내부 확인 필요도: ${risk()}`;
}

function linkButton(label, href, className = '') {
  const target = href || '#';
  return `<a class="action ${className}" href="${target}" target="_blank" rel="noopener">${label}</a>`;
}

function complete() {
  const rows = summaryRows().map(([label, value]) => `<div><b>${label}</b><span>${value || '미입력'}</span></div>`).join('');
  const admin = adminText();
  $('#app').innerHTML = `
    <div class="brand">${logo()}<div><b>${co.companyName}</b><br><small>상담 접수 완료</small></div></div>
    <section class="complete">
      <h1>${co.completeTitle}</h1>
      <p>${co.completeBody}</p>
      <div class="hint strong-hint">상담 내용이 정리되었습니다.<br>사진이 있으시면 전화 상담 후 안내받은 번호로 보내주시거나, 카카오톡, 문자, 네이버 톡톡으로 이어서 보내주세요.<br>사진이 있으면 더 정확한 상담이 가능합니다.</div>
      <h2>입력하신 내용</h2>
      <div class="summary">${rows}</div>
      <div class="actions">
        ${linkButton('전화 상담 요청하기', co.phoneNumber ? `tel:${co.phoneNumber}` : '', 'primary-action phone-action')}
        ${linkButton('카카오톡으로 상담 이어가기', co.kakaoLink, 'secondary-action kakao-action')}
        ${linkButton('문자 상담하기', co.smsNumber ? `sms:${co.smsNumber}` : '', 'secondary-action')}
        ${linkButton('네이버 톡톡으로 상담 이어가기', co.naverTalkLink, 'secondary-action')}
      </div>
      <h2>대표님 전달용 상담 요약</h2>
      <button class="ghost" onclick="copy()">요약 복사하기</button>
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
