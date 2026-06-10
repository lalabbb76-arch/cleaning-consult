# GitHub Pages 배포 안내

이 폴더는 별도 빌드가 필요 없는 정적 사이트입니다.

## 현재 로컬 폴더

```txt
C:\Users\user\Desktop\lalabb-consult-link-template
```

## GitHub Pages 권장 저장소

```txt
owner: lalabbb76-arch
repo: cleaning-consult
branch: main
publish source: Deploy from a branch / main / root
```

## 공개 링크 예상 주소

```txt
https://lalabbb76-arch.github.io/cleaning-consult/?company=zendella
https://lalabbb76-arch.github.io/cleaning-consult/?company=tsunami
```

## 배포 명령어

GitHub에 `lalabbb76-arch/cleaning-consult` 저장소를 먼저 만든 뒤 아래를 실행합니다.

```bash
cd /c/Users/user/Desktop/lalabb-consult-link-template

git init
git branch -M main
git add .
git commit -m "Add multi-company cleaning consult MVP"
git remote add origin https://github.com/lalabbb76-arch/cleaning-consult.git
git push -u origin main
```

그 다음 GitHub 웹사이트에서:

```txt
Repository → Settings → Pages → Build and deployment
Source: Deploy from a branch
Branch: main
Folder: /root
Save
```

## 새 업체 추가

`company-settings.js`에 업체 설정을 추가합니다.

예:

```js
companyA: {
  companyName: "새 청소업체",
  logoText: "새",
  mainColor: "#6FBF9A",
  subColor: "#F5FBF8",
  buttonColor: "#4FAF86",
  serviceType: "cleaning",
  kakaoLink: "",
  naverTalkLink: "",
  phoneNumber: "",
  smsNumber: "",
  blogCtaTitle: "청소 상담이 필요하시다면",
  blogCtaBody: "사진과 주소만 남겨주세요. 상담에 필요한 내용을 정리해드립니다.",
  blogCtaButton: "사진으로 상담 받기"
}
```

접속 주소:

```txt
https://lalabbb76-arch.github.io/cleaning-consult/?company=companyA
```

## 현재 사진 업로드 상태

현재 사진 업로드는 UI MVP입니다.

- 사진 선택 가능
- 썸네일 미리보기 가능
- 삭제 가능
- 실제 서버 저장은 아직 없음

운영용으로 사진 저장을 붙이려면 Supabase Storage, Firebase Storage, Cloudflare R2, S3 같은 저장소와 상담 접수 DB를 연결하는 방식이 좋습니다.
