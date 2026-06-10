# Google Sheets 상담 접수 자동 저장 설정 안내

이 프로젝트는 GitHub Pages 정적 사이트에서 Google Apps Script Web App으로 상담 내용을 보내고, Google Sheets의 `상담접수` 시트에 한 줄씩 저장합니다.

## 1. Google Sheets 구조

새 Google Sheets 파일을 만들고 이름을 예를 들어 아래처럼 정합니다.

```txt
라비 상담접수함
```

Apps Script가 처음 실행될 때 `상담접수` 시트를 자동으로 만들고 아래 컬럼을 1행에 넣습니다.

```txt
접수일시
브랜드명
company 값
주소/건물명
공간 유형
상담 종류
에어컨 종류
에어컨 대수
청소 이유
에어컨 추가 내용
평수/면적
주거 구조
상업 공간 형태
작업 범위
영업 상태
짐/집기 여부
오염 상태
사진 상태
희망 일정
희망 시간대
추가 요청사항
선호 연락 방법
고객이 선택한 연락 버튼
관리자 상담 요약
유입 경로
접수 상태
```

사진 상태는 현재 MVP 기준으로 항상 아래처럼 저장됩니다.

```txt
상담 후 별도 전송
```

## 2. Apps Script 여는 방법

1. Google Sheets 파일을 엽니다.
2. 상단 메뉴에서 `확장 프로그램`을 누릅니다.
3. `Apps Script`를 누릅니다.
4. 새 탭이 열리면 기본 `Code.gs` 파일의 내용을 모두 지웁니다.
5. 이 프로젝트의 아래 파일 내용을 그대로 붙여넣습니다.

```txt
google-apps-script/lead-intake-webapp.gs
```

## 3. Web App으로 배포하는 방법

1. Apps Script 화면 오른쪽 위의 `배포` 버튼을 누릅니다.
2. `새 배포`를 누릅니다.
3. 톱니바퀴 또는 유형 선택에서 `웹 앱`을 선택합니다.
4. 설명은 예를 들어 아래처럼 입력합니다.

```txt
라비 상담접수 저장 Web App
```

5. `다음 사용자로 실행`은 `나`로 선택합니다.
6. `액세스 권한이 있는 사용자`는 `모든 사용자`로 선택합니다.
   - 고객이 로그인하지 않아도 상담 접수가 저장되게 하기 위한 설정입니다.
   - 시트 자체를 공개 공유하는 뜻은 아닙니다.
7. `배포`를 누릅니다.
8. 처음 배포 시 Google 권한 승인 화면이 나옵니다.
9. 본인 Google 계정으로 승인합니다.
10. 배포가 완료되면 `웹 앱 URL`을 복사합니다.

웹 앱 URL은 보통 아래처럼 생겼습니다.

```txt
https://script.google.com/macros/s/긴문자열/exec
```

## 4. Web App URL을 사이트 설정에 넣는 방법

`company-settings.js`에서 브랜드별 `leadWebhookUrl` 값을 채웁니다.

전데렐라와 쓰나미가 같은 Google Sheets에 저장되어도 괜찮습니다. `브랜드명`과 `company 값`으로 구분됩니다.

```js
zendella: {
  companyName: '전데렐라의 청소생각',
  leadWebhookUrl: '여기에 Web App URL 붙여넣기',
  // ...
}
```

```js
tsunami: {
  companyName: '쓰나미파워클린',
  leadWebhookUrl: '여기에 Web App URL 붙여넣기',
  // ...
}
```

## 5. 개인정보/운영 주의

- Google Sheets 파일은 외부 공개하지 마세요.
- 공유 권한은 윤경님 또는 담당자 계정만 보게 설정하세요.
- 현재 폼은 고객 전화번호를 직접 입력받지 않고, 고객이 전화/문자/카카오톡/네이버 톡톡으로 직접 연락하는 구조입니다.
- 나중에 전화번호 입력란을 추가하면 개인정보 수집 동의 문구가 필요합니다.

## 6. 테스트 방법

1. `company-settings.js`에 Web App URL을 넣습니다.
2. GitHub Pages에 반영합니다.
3. 전데렐라 링크에서 테스트 접수합니다.

```txt
https://lalabbb76-arch.github.io/cleaning-consult/?company=zendella
```

4. 쓰나미 링크에서 테스트 접수합니다.

```txt
https://lalabbb76-arch.github.io/cleaning-consult/?company=tsunami
```

5. Google Sheets의 `상담접수` 시트에 행이 추가되는지 확인합니다.
6. 브랜드명과 company 값이 아래처럼 구분되는지 확인합니다.

```txt
전데렐라의 청소생각 / zendella
쓰나미파워클린 / tsunami
```

## 7. 실패 시 고객 화면 동작

저장에 실패해도 고객 상담은 막히지 않습니다.

- 전화 상담 버튼은 계속 작동합니다.
- 문자 상담 버튼은 상담 요약이 자동 입력된 SMS 화면으로 연결됩니다.
- 카카오톡/네이버 톡톡 링크가 비어 있으면 준비 중 안내가 표시됩니다.
