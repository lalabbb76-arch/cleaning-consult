const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let key = new URLSearchParams(location.search).get('company') || location.pathname.split('/').filter(Boolean).pop() || 'zendella';
if (!companySettings[key]) key = 'zendella';
let co = companySettings[key];
let i = -1;

const f = {
  address: '',
  spaceType: '',
  serviceKind: '',
  area: '',
  rooms: '',
  baths: '',
  balcony: '',
  expansion: '',
  structureNote: '',
  water: '',
  place: '',
  height: '',
  conditionNote: '',
  repair: [],
  repairNote: '',
  dirt: [],
  schedule: '',
  scheduleNote: '',
  contact: ''
};

const score = {
  '창틀 먼지': 1, '욕실 물때': 1, '주방 기름때': 2, '곰팡이': 2, '공사먼지': 2,
  '부분 인테리어 후 먼지': 2, '페인트 자국/먼지': 2, '수납장 내부 먼지': 1,
  '반려동물 털': 1, '냄새': 1, '짐이 있어요': 2, '먼지': 1, '기름때': 2,
  '물때': 1, '이끼': 2, '찌든때': 2, '타이어 자국': 2, '녹물 자국': 2,
  '흙먼지': 1, '배수구 주변 오염': 2
};

function theme() {
  document.documentElement.style.setProperty('--main', co.mainColor);
  document.documentElement.style.setProperty('--sub', co.subColor);
  document.documentElement.style.setProperty('--btn', co.buttonColor);
  document.title = `${co.companyName} 상담 링크`;
  $$('[data-co]').forEach((button) => button.classList.toggle('on', button.dataset.co === key));
}

function lg() {
  return `<div class="logo">${co.logoText || co.companyName[0]}</div>`;
}

function init() {
  theme();
  hero();
  blog();
}

function hero() {
  $('#app').innerHTML = `
    <div class="brand">${lg()}<div><b>${co.companyName}</b><br><small>브랜드별 상담 링크</small></div></div>
    <div class="hero-art"><div class="check">✓</div><div class="fake"><div class="line w70"></div><div class="line"></div><div class="line w45"></div></div></div>
    <h1>${co.startTitle}</h1>
    <p>주소와 기본 정보를 남겨주시면<br>작업 범위와 예산 상담에 필요한 내용을 정리해드립니다.<br><br>현장 작업 중에는 전화 상담이 가장 빠릅니다.</p>
    <p><small>1~2분이면 상담 접수가 완료됩니다.</small></p>
    <button class="primary full hero-btn" onclick="start()">상담 시작하기</button>`;
}

function blog() {
  $('#blog').innerHTML = `
    <div class="brand">${lg()}<div><b>블로그 삽입용 CTA</b><br><small>${co.companyName}</small></div></div>
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
  const base = [
    ['address'], ['space'], ['service'], ['area'],
    [co.conditionMode === 'work' ? 'work' : 'home']
  ];
  if (co.conditionMode !== 'work') base.push(['repair']);
  base.push(['dirt'], ['photos'], ['schedule'], ['contact'], ['complete']);
  return base.map((item) => item[0]);
}

function progress() {
  const total = steps().length - 1;
  return `
    <button class="back" onclick="prev()">‹</button>
    <div class="progress"><b>상담 정보 입력 중 ${Math.min(i + 1, total)} / ${total}</b><span style="width:${Math.min(((i + 1) / total) * 100, 100)}%"></span></div>`;
}

function layout(title, body, foot = '') {
  $('#app').innerHTML = `${progress()}<section class="step"><h1>${title}</h1>${body}</section><div class="nav">${foot || '<button class="ghost" onclick="next(true)">건너뛰기</button><button class="primary" onclick="next()">다음</button>'}</div>`;
}

function chips(field, options, multi = false) {
  const values = multi ? f[field] : [f[field]];
  return `<div class="chips">${options.map((option) => `<button class="chip ${values.includes(option) ? 'sel' : ''}" onclick="${multi ? `tog('${field}','${option}')` : `sel('${field}','${option}')`}">${option}</button>`).join('')}</div>`;
}

function render() {
  const s = steps()[i];
  if (s === 'address') {
    layout('청소할 곳의 주소나 건물명을 알려주세요.', `
      <p>정확한 동·호수는 입력하지 않으셔도 됩니다.<br>동네명이나 건물명만으로도 상담을 시작할 수 있습니다.</p>
      <input value="${f.address}" oninput="f.address=this.value" placeholder="예: 신길동 레이안아파트">
      <div class="hint">상세 주소는 상담이 확정된 뒤 알려주셔도 괜찮습니다.</div>`);
  }
  if (s === 'space') {
    layout('어떤 공간 상담이 필요하신가요?', chips('spaceType', co.spaceTypes));
  }
  if (s === 'service') {
    layout(co.serviceType === 'powerCleaning' ? '어떤 세척이 필요하신가요?' : '어떤 청소가 필요하신가요?', `
      ${chips('serviceKind', co.serviceKinds)}
      <div class="hint">정확히 모르셔도 괜찮습니다. 상담 내용을 보고 필요한 범위를 함께 확인해드립니다.</div>`);
  }
  if (s === 'area') {
    layout(co.areaTitle, `<p>정확하지 않아도 괜찮습니다. 비슷한 크기를 선택해주세요.</p>${chips('area', co.areaOptions)}`);
  }
  if (s === 'home') {
    layout('구조를 알고 계시면 선택해주세요.', `
      <p>방, 욕실, 베란다 개수를 알려주시면 상담에 도움이 됩니다.</p>
      <h3>방은 몇 개인가요?</h3>${chips('rooms', ['1개', '2개', '3개', '4개 이상', '잘 모르겠어요'])}
      <h3>욕실은 몇 개인가요?</h3>${chips('baths', ['1개', '2개', '3개 이상', '잘 모르겠어요'])}
      <h3>베란다나 다용도실이 있나요?</h3>${chips('balcony', ['없음', '1개', '2개 이상', '잘 모르겠어요'])}
      <h3>확장된 공간이 있나요?</h3>${chips('expansion', ['확장형', '비확장형', '일부 확장', '잘 모르겠어요'])}
      <textarea oninput="f.structureNote=this.value" placeholder="예: 방3, 욕실2, 베란다1 / 거실 확장형">${f.structureNote}</textarea>`);
  }
  if (s === 'work') {
    layout('작업 조건을 알려주세요.', `
      <p>물 사용 가능 여부나 작업 위치를 알려주시면 작업 가능 여부와 견적 확인에 도움이 됩니다.</p>
      <h3>현장에서 물 사용이 가능한가요?</h3>${chips('water', ['가능해요', '어려울 수 있어요', '잘 모르겠어요'])}
      <h3>작업 위치가 어디인가요?</h3>${chips('place', ['실내', '실외', '지하주차장', '건물 외벽', '상가 앞', '옥상/계단', '잘 모르겠어요'])}
      <h3>높은 곳 작업이 필요한가요?</h3>${chips('height', ['필요 없어요', '2층 이상', '사다리 필요', '장비 확인 필요', '잘 모르겠어요'])}
      <textarea oninput="f.conditionNote=this.value" placeholder="예: 상가 앞 바닥입니다 / 물 사용 가능해요">${f.conditionNote}</textarea>`);
  }
  if (s === 'repair') {
    layout('최근 수리나 인테리어 작업이 있었나요?', `
      <p>공사 후 먼지, 페인트 자국, 마감 잔여물 확인에 도움이 됩니다.</p>
      ${chips('repair', ['없어요', '전체 인테리어', '부분 인테리어', '도배/장판', '페인트', '주방', '욕실', '필름/문/몰딩', '기타', '잘 모르겠어요'], true)}
      <textarea oninput="f.repairNote=this.value" placeholder="예: 주방만 교체했어요 / 페인트 작업을 했어요">${f.repairNote}</textarea>`);
  }
  if (s === 'dirt') {
    layout(co.dirtTitle, `
      <p>여러 개 선택하셔도 괜찮습니다. 정확히 모르시면 상담 후 사진으로 이어서 보내주셔도 됩니다.</p>
      ${chips('dirt', co.dirtOptions, true)}
      <div class="hint">오염 상태는 평가가 아니라 작업 범위와 예산을 확인하기 위한 자료입니다.</div>`);
  }
  if (s === 'photos') {
    layout('사진이 있으시면 상담 후 이어서 보내주세요.', `
      <p>현재 페이지에서는 사진을 직접 저장하지 않습니다.<br>상담 내용을 남겨주신 뒤, 전화 상담 또는 카카오톡/네이버 톡톡으로 사진을 이어서 보내주시면 더 정확히 안내드릴 수 있습니다.</p>
      <div class="hint">사진은 예쁘게 찍지 않으셔도 괜찮습니다. 전체 구조와 걱정되는 부분이 보이면 충분합니다.</div>
      <div class="upload notice-upload">
        <b>사진은 이 페이지에 저장되지 않습니다.</b><br>
        상담 완료 후 안내받은 번호, 카카오톡 또는 네이버 톡톡으로 보내주세요.
      </div>
      <div class="upload-actions">
        <button class="ghost" onclick="examples()">사진 예시 보기</button>
        <button class="primary" onclick="next()">사진은 상담 후 보내기</button>
      </div>`,
      `<button class="ghost" onclick="prev()">이전</button><button class="primary" onclick="next()">사진은 상담 후 보내기</button>`);
  }
  if (s === 'schedule') {
    layout('희망하시는 작업 일정이 있으신가요?', `
      ${chips('schedule', ['이번 주', '다음 주', '날짜 선택', '아직 미정'])}
      <textarea oninput="f.scheduleNote=this.value" placeholder="예: 오전이면 좋아요 / 주말 상담 원합니다">${f.scheduleNote}</textarea>`);
  }
  if (s === 'contact') {
    layout('상담을 이어받을 방법을 선택해주세요.', `
      <p>현장 작업 중에는 전화 상담이 가장 빠릅니다.<br>통화가 어려우시면 카카오톡이나 네이버 톡톡으로 이어서 보내주세요.</p>
      <div class="contact-choices">
        <button class="contact-chip phone ${f.contact === '전화 상담' ? 'sel' : ''}" onclick="sel('contact','전화 상담')">전화 상담</button>
        <button class="contact-chip ${f.contact === '카카오톡 상담' ? 'sel' : ''}" onclick="sel('contact','카카오톡 상담')">카카오톡 상담</button>
        <button class="contact-chip ${f.contact === '네이버 톡톡 상담' ? 'sel' : ''}" onclick="sel('contact','네이버 톡톡 상담')">네이버 톡톡 상담</button>
        <button class="contact-chip ${f.contact === '문자 상담' ? 'sel' : ''}" onclick="sel('contact','문자 상담')">문자 상담</button>
      </div>
      <div class="hint">작성하신 상담 내용은 담당자가 확인할 수 있도록 정리됩니다. 사진은 상담 후 카카오톡이나 톡톡으로 보내주시면 더 정확히 안내드릴 수 있습니다.</div>`);
  }
  if (s === 'complete') complete();
}

function sel(field, value) {
  f[field] = value;
  render();
}

function tog(field, value) {
  const arr = f[field];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(value);
  render();
}

function next(skip = false) {
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

function examples() {
  const items = co.photoGuide.map((guide, idx) => `<li><b>${idx + 1}. ${guide[0]}</b><br>${guide[1]}</li>`).join('');
  $('#modal').classList.remove('hide');
  $('#modal').innerHTML = `<div class="modal-card"><h2>이런 사진이면 충분합니다.</h2><ol>${items}</ol><button class="primary full" onclick="$('#modal').classList.add('hide')">확인했어요</button></div>`;
}

function risk() {
  const total = f.dirt.reduce((sum, item) => sum + (score[item] || 0), 0);
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

function summaryRows() {
  if (co.conditionMode === 'work') {
    return [
      ['작업 공간', f.spaceType], ['세척 종류', f.serviceKind], ['면적', f.area],
      ['작업 위치', f.place], ['물 사용 가능 여부', f.water], ['높이/장비', f.height],
      ['오염 상태', f.dirt.join(', ') || '미입력'], ['사진', '상담 후 별도 전송'], ['희망 일정', f.schedule]
    ];
  }
  return [
    ['공간', f.spaceType], ['청소 종류', f.serviceKind], ['평수/구조', `${f.area || '미입력'} / ${homeStructure()}`],
    ['수리 여부', f.repair.join(', ') || '미입력'], ['걱정되는 부분', f.dirt.join(', ') || '미입력'],
    ['사진', '상담 후 별도 전송'], ['희망 일정', f.schedule]
  ];
}

function adminText() {
  if (co.conditionMode === 'work') {
    return `[${co.adminSummaryTitle}]\n\n주소/건물명: ${f.address || ''}\n작업 공간: ${f.spaceType || ''}\n세척 종류: ${f.serviceKind || ''}\n대략 면적: ${f.area || ''}\n작업 위치: ${f.place || ''}\n물 사용 가능 여부: ${f.water || ''}\n높이/장비 필요 여부: ${f.height || ''}\n오염 상태: ${f.dirt.join(', ')}\n사진: 상담 후 별도 전송\n희망 일정: ${f.schedule || ''}\n선호 연락 방법: ${f.contact || ''}\n추가 요청: ${f.conditionNote || f.scheduleNote || ''}\n\n내부 오염도 판단: ${risk()}`;
  }
  return `[${co.adminSummaryTitle}]\n\n주소/건물명: ${f.address || ''}\n공간 유형: ${f.spaceType || ''}\n청소 종류: ${f.serviceKind || ''}\n평수: ${f.area || ''}\n구조: ${homeStructure()}\n수리 여부: ${f.repair.join(', ')}\n걱정되는 부분: ${f.dirt.join(', ')}\n사진: 상담 후 별도 전송\n희망 일정: ${f.schedule || ''}\n선호 연락 방법: ${f.contact || ''}\n추가 요청: ${f.structureNote || f.repairNote || f.scheduleNote || ''}\n\n내부 오염도 판단: ${risk()}`;
}

function linkButton(label, href, className = '') {
  const target = href || '#';
  return `<a class="action ${className}" href="${target}" target="_blank" rel="noopener">${label}</a>`;
}

function complete() {
  const rows = summaryRows().map(([label, value]) => `<div><b>${label}</b><span>${value || '미입력'}</span></div>`).join('');
  const admin = adminText();
  $('#app').innerHTML = `
    <div class="brand">${lg()}<div><b>${co.companyName}</b><br><small>상담 접수 완료</small></div></div>
    <section class="complete">
      <h1>${co.completeTitle}</h1>
      <p>${co.completeBody}</p>
      <div class="hint strong-hint">상담 내용이 정리되었습니다.<br>사진이 있으시면 전화 상담 후 안내받은 번호로 보내주시거나, 카카오톡/네이버 톡톡으로 이어서 보내주세요.<br>사진이 있으면 더 정확한 상담이 가능합니다.</div>
      <h2>입력하신 내용</h2>
      <div class="summary">${rows}</div>
      <div class="actions">
        ${linkButton('전화 상담 요청하기', co.phoneNumber ? `tel:${co.phoneNumber}` : '', 'primary-action phone-action')}
        ${linkButton('카카오톡으로 상담 이어가기', co.kakaoLink, 'secondary-action')}
        ${linkButton('네이버 톡톡으로 상담 이어가기', co.naverTalkLink, 'secondary-action')}
        ${linkButton('문자 상담하기', co.smsNumber ? `sms:${co.smsNumber}` : '', 'secondary-action')}
      </div>
      <h2>대표님 전달용 상담 요약</h2>
      <button class="ghost" onclick="copy()">요약 복사하기</button>
      <textarea id="admin" readonly>${admin}</textarea>
      <p><small>담당자가 확인 후 안내드립니다. 추가 사진이나 요청사항은 전화 상담 후 안내받은 번호, 카카오톡 또는 네이버 톡톡으로 보내주세요.</small></p>
    </section>`;
}

function copy() {
  navigator.clipboard.writeText($('#admin').value).then(() => alert('상담 요약을 복사했습니다.'));
}

function switchCompany(nextKey) {
  location.href = `${location.pathname}?company=${nextKey}`;
}

init();
