# 라비 다중 업체용 청소·세척 상담 링크 MVP

고객은 부담 없이 누르고, 대표님은 정리된 상담 정보를 받는 브랜드별 청소·세척 상담 링크 템플릿입니다.

## 현재 폴더

```txt
C:\Users\user\Desktop\lalabb-consult-link-template
```

## 파일 구조

```txt
index.html
styles.css
app.js
company-settings.js
blog-buttons.html
DEPLOY_GITHUB_PAGES.md
README.md
.nojekyll
PATH_TEST.txt
```

## 로컬 실행

```bash
cd /c/Users/user/Desktop/lalabb-consult-link-template
python -m http.server 4173
```

## 로컬 확인 주소

```txt
http://localhost:4173/?company=zendella
http://localhost:4173/?company=tsunami
http://localhost:4173/?company=sampleCompany
```

## GitHub Pages 공개 링크 예상 주소

저장소를 `lalabbb76-arch/cleaning-consult`로 만들고 GitHub Pages를 켜면 아래 주소가 됩니다.

```txt
https://lalabbb76-arch.github.io/cleaning-consult/?company=zendella
https://lalabbb76-arch.github.io/cleaning-consult/?company=tsunami
```

## 새 업체 추가

`company-settings.js`에 업체 설정을 추가합니다. 업체별 페이지를 복사하지 않고 공통 템플릿 + 업체 설정값으로 운영합니다.

## 현재 구현된 기능

- 브랜드별 색상/문구/서비스 종류 전환
- 블로그 CTA
- 진행률 표시
- 한 화면 한 질문
- 잘 모르겠어요 선택지
- 사진 선택 업로드 UI
- 사진 썸네일 미리보기
- 사진 삭제
- 사진 예시 팝업
- 고객 완료 요약
- 대표님 전달용 복사용 상담 요약
- 내부 오염도 점수화

## 사진 업로드 상태

이번 MVP에서는 사진을 실제 서버에 저장하지 않습니다.

- 사진을 올리지 않아도 상담 접수 가능
- 사진이 있으면 더 정확히 안내한다는 문구 표시
- 추가 사진은 카카오톡 또는 네이버 톡톡으로 이어서 보내도록 안내

## 실제 운영 전 필요한 것

- GitHub Pages 또는 Vercel/Netlify 배포
- 실제 카카오채널 링크 입력
- 실제 네이버 톡톡 링크 입력
- 사진 저장소 연결
- 상담 접수 DB 연결
- 이메일/문자/알림 발송 연결
