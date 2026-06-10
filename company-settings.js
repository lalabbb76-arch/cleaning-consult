const commonServiceKinds = [
  '에어컨 분해청소',
  '입주청소',
  '이사청소',
  '벽걸이 에어컨 청소',
  '스탠드 에어컨 청소',
  '2 in 1 에어컨 청소',
  '시스템 에어컨 청소',
  '거주청소',
  '부분청소',
  '사무실청소',
  '상가청소',
  '잘 모르겠어요'
];

const commonSpaceTypes = ['아파트', '빌라/다세대', '오피스텔', '사무실', '상가/매장', '학원/병원/공방', '기타'];
const commonAreaOptions = ['10평 미만', '10평대', '20평대', '30평대', '40평대', '50평 이상', '잘 모르겠어요'];
const commonDirtOptions = [
  '공사먼지', '창틀 먼지', '욕실 물때', '주방 기름때', '곰팡이', '수납장 내부 먼지',
  '반려동물 털', '냄새', '짐이 있어요', '부분 인테리어 후 먼지', '페인트 자국/먼지', '잘 모르겠어요'
];
const commonPhotoGuide = [
  ['에어컨 전체 모습', '에어컨 전체가 보이게 찍어주세요. 2 in 1인 경우 거실 스탠드와 방 벽걸이 에어컨 전체 모습이 각각 보이게 찍어주세요.'],
  ['에어컨 모델명 또는 제품 스티커', '모델명 라벨이나 제품 스티커가 보이면 더 정확한 상담에 도움이 됩니다.'],
  ['설치 위치', '거실, 안방, 작은방, 천장 위치처럼 설치된 공간이 보이면 좋습니다.'],
  ['곰팡이, 먼지, 냄새가 걱정되는 부분', '송풍구, 필터 주변, 바람 나오는 부분 등 걱정되는 곳을 찍어주세요.'],
  ['실외기 주변', '실외기 위치 확인이 필요한 경우 실외기 주변도 함께 찍어주세요.'],
  ['거실, 방, 주방 전체 구조', '입주청소/이사청소는 공간 전체 구조가 보이면 상담에 도움이 됩니다.'],
  ['욕실, 창틀, 주방 오염 부분', '오염이 걱정되는 부분을 가까이 찍어주세요.'],
  ['공사먼지나 페인트 자국', '수리나 인테리어 후 남은 먼지, 페인트 자국을 찍어주세요.'],
  ['수리나 인테리어한 부분', '도배, 장판, 주방, 욕실 등 공사한 부분이 있으면 함께 찍어주세요.'],
  ['평면도나 매물 캡처', '구조를 알 수 있는 화면이면 괜찮습니다. 개인정보는 가리고 보내셔도 됩니다.']
];

const balancedHeroBody = '에어컨 분해청소, 입주청소, 이사청소처럼\n필요한 청소 내용을 간편하게 남겨주세요.\n\n주소와 기본 정보를 남겨주시면\n작업 범위와 예산 상담에 필요한 내용을 정리해드립니다.\n\n전화가 편하시면 빠르게 상담드리고,\n통화가 어려우시면 카카오톡, 문자, 네이버 톡톡으로도 가능합니다.\n\n1~2분이면 상담 접수가 완료됩니다.';
const balancedBlogTitle = '에어컨 청소, 입주청소, 이사청소가 필요하시다면';
const balancedBlogBody = '기본 정보를 먼저 남겨주세요.\n집 상태와 청소 범위를 확인한 뒤\n상황에 맞는 상담을 도와드립니다.\n\n전화가 편하시면 빠르게 상담드리고,\n통화가 어려우시면 카카오톡, 문자, 네이버 톡톡으로도 가능합니다.';

const companySettings = {
  zendella: {
    companyName: '전데렐라의 청소생각',
    logoText: '전',
    mainColor: '#6FBF9A',
    subColor: '#F5FBF8',
    buttonColor: '#4FAF86',
    serviceType: 'cleaning',
    toneLabel: '따뜻하고 친절한 청소 상담',
    startTitle: '청소 상담을 시작해볼까요?',
    heroBody: balancedHeroBody,
    kakaoLink: '',
    naverTalkLink: '',
    phoneNumber: '010-8765-9925',
    smsNumber: '010-8765-9925',
    blogCtaTitle: balancedBlogTitle,
    blogCtaBody: balancedBlogBody,
    blogCtaButton: '청소 상담 남기기',
    spaceTypes: commonSpaceTypes,
    serviceKinds: commonServiceKinds,
    areaTitle: '대략 몇 평대인가요?',
    areaOptions: commonAreaOptions,
    conditionMode: 'home',
    dirtTitle: '걱정되는 부분을 골라주세요.',
    dirtOptions: commonDirtOptions,
    photoGuide: commonPhotoGuide,
    completeTitle: '상담 정보가 정리되었습니다.',
    completeBody: '입력해주신 내용을 기준으로 선택하신 청소 상담 종류와 필요한 확인 내용이 정리되었습니다. 정확한 금액은 사진과 현장 상태 확인 후 안내드립니다.',
    adminSummaryTitle: '전데렐라의 청소생각 상담 접수'
  },
  tsunami: {
    companyName: '쓰나미파워클린',
    logoText: '쓰',
    mainColor: '#1E88E5',
    subColor: '#F3FAFF',
    buttonColor: '#1565C0',
    serviceType: 'cleaning',
    toneLabel: '시원하고 전문적인 청소 상담',
    startTitle: '청소 상담을 시작해볼까요?',
    heroBody: balancedHeroBody,
    kakaoLink: '',
    naverTalkLink: '',
    phoneNumber: '010-4656-9925',
    smsNumber: '010-4656-9925',
    blogCtaTitle: balancedBlogTitle,
    blogCtaBody: balancedBlogBody,
    blogCtaButton: '청소 상담 남기기',
    spaceTypes: commonSpaceTypes,
    serviceKinds: commonServiceKinds,
    areaTitle: '대략 몇 평대인가요?',
    areaOptions: commonAreaOptions,
    conditionMode: 'home',
    dirtTitle: '걱정되는 부분을 골라주세요.',
    dirtOptions: commonDirtOptions,
    photoGuide: commonPhotoGuide,
    completeTitle: '상담 정보가 정리되었습니다.',
    completeBody: '입력해주신 내용을 기준으로 선택하신 청소 상담 종류와 필요한 확인 내용이 정리되었습니다. 정확한 금액은 사진과 현장 상태 확인 후 안내드립니다.',
    adminSummaryTitle: '쓰나미파워클린 상담 접수'
  },
  sampleCompany: {
    companyName: '샘플 업체',
    logoText: '샘',
    mainColor: '#8A7CF6',
    subColor: '#F7F5FF',
    buttonColor: '#7061E8',
    serviceType: 'cleaning',
    toneLabel: '샘플 청소 상담',
    startTitle: '청소 상담을 시작해볼까요?',
    heroBody: balancedHeroBody,
    kakaoLink: '',
    naverTalkLink: '',
    phoneNumber: '',
    smsNumber: '',
    blogCtaTitle: balancedBlogTitle,
    blogCtaBody: balancedBlogBody,
    blogCtaButton: '청소 상담 남기기',
    spaceTypes: commonSpaceTypes,
    serviceKinds: commonServiceKinds,
    areaTitle: '대략 몇 평대인가요?',
    areaOptions: commonAreaOptions,
    conditionMode: 'home',
    dirtTitle: '걱정되는 부분을 골라주세요.',
    dirtOptions: commonDirtOptions,
    photoGuide: commonPhotoGuide,
    completeTitle: '상담 정보가 정리되었습니다.',
    completeBody: '입력해주신 내용을 기준으로 상담에 필요한 정보가 정리되었습니다. 정확한 금액은 사진과 현장 상태 확인 후 안내드립니다.',
    adminSummaryTitle: '샘플 업체 상담 접수'
  }
};
