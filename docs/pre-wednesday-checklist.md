# 수요일 계정 구매 전 체크리스트

작성: 2026-10-12. 목표: **수요일(2026-10-14)**에 Apple Developer Program +
Google Play Console을 구매하고, 그 즉시 제출 단계로 넘어갈 수 있도록 — 계정이
없어도 할 수 있는 일은 전부 그 전에 끝내둔다.

구매 이후 전체 절차는 `docs/release-checklist.md` 참고. 이 문서는 "돈 나가기
전에 할 수 있는 것"만 긴급도 순으로 뽑아둔 서브셋.

⚠️ **현실 체크**: Google Play는 신규 개인 계정일 경우 프로덕션 배포 전에
**테스터 12명 이상으로 14일 연속 closed testing**을 돌려야 함. 수요일에
시작해도 가장 빠른 프로덕션 배포는 **2026-10-28**. 그래도 Play Console은
수요일에 바로 사야 함 — 계정이 존재해야 타이머가 시작되므로, 구매를 미루면
그만큼 전체 일정이 밀림.

## 코드 작업 (계정 불필요)

- [x] 계정 삭제 기능 (DB row + storage 파일 + auth 유저 삭제) — 구현 완료,
      로컬+호스팅 둘 다 실제로 업로드→삭제→확인까지 end-to-end 테스트함.
      My 탭이 아직 없어서 버튼만 bare하게 박아둔 상태 (`app/(tabs)/my.tsx`)
- [x] ~~백그라운드 위치 Prominent Disclosure 화면~~ — 불필요해짐: `app.json`/
      `backgroundLocationTask.ts`가 이미 "Always" 권한을 아예 안 받는 방식으로
      바뀌어 있었음 (while-in-use 권한 + foreground service만으로 화면 꺼진
      상태에서도 기록 계속). 이 화면은 `ACCESS_BACKGROUND_LOCATION` 선언하는
      앱한테만 필요한데, 이 앱은 그 권한 자체를 선언 안 함
- [x] `android.targetSdkVersion` 확인 — `npx expo prebuild --platform android`
      빌드해서 직접 확인: `targetSdk 36` (Android 16), Play 요구 버전보다
      충분히 높음. gitignore된 `android/` 폴더는 검증용, 커밋 안 함
- [x] Impact card Download 코드 재검토 — `requestPermissionsAsync(true)`
      (write-only 요청) + `MediaLibrary.Asset.create()` (scoped storage용
      신규 API) 조합이 `granularPermissions: []`랑 로직상 맞음. 단, 이 환경에
      안드로이드 에뮬레이터가 없어서 런타임 검증은 못 함 — 실기기 테스트 때 필요
- [x] `console.log`/`console.error` 전수 조사 — 전부 `catch` 블록 안의 정상적인
      에러 로깅(`console.error`)이고 디버그용 `console.log`는 하나도 없음.
      정리할 게 없었음
- [x] MVP 범위 확인 — Copy Link / Instagram Story 둘 다 `app/impact-card.tsx`
      에서 아예 숨겨져 있는 거 코드로 확인함 (주석에 "Hidden for release" 명시)

## 디자인 에셋 (계정 불필요)

- [ ] 실제 앱 아이콘 + 안드로이드 adaptive icon + 스플래시 화면 (지금은 Expo
      기본 템플릿 그대로)
- [ ] 스토어 스크린샷 — 6.9" iPhone 사이즈, 안드로이드 폰 사이즈 (촬영은 지금
      가능, 업로드는 스토어 리스팅 생긴 다음에)
- [ ] Play feature graphic (1024×500) + 512px 아이콘

## 무료 외부 서비스 (유료 스토어 계정과 별개)

- [ ] 안드로이드용 Google Maps API 키 — **Google Cloud Console**에서 발급,
      무료, Play Console $25와 무관. 발급 후 패키지명 + 릴리즈 SHA-1로 제한 설정
- [ ] Meta App ID — Instagram Story 공유 기능 유지할 경우에만 필요, Facebook
      Developer 계정도 무료

## 콘텐츠/문구 (계정 불필요)

- [ ] Privacy policy 페이지 (무료 호스팅 — Notion, GitHub Pages 등)
- [ ] Support URL / 페이지
- [x] App Store / Play 심사 노트 초안 — `docs/store-listing-draft.md`에 포함
- [x] 스토어 리스팅 문구 초안 — `docs/store-listing-draft.md` (설명, 키워드,
      프로모션 텍스트, 심사 노트까지). 최종 제출 전에 검수 필요, 1차 초안임

## 테스트 (계정 불필요)

- [ ] 실기기 풀 플로우 테스트, iOS 1대+ / 안드로이드 1대+: 기록 → 일시정지 →
      종료 → Litter log → Impact card → 공유
- [ ] 첫 실제 안드로이드 실행 — 지금까지 iOS 시뮬레이터로만 테스트함
- [ ] 기록 중 강제종료 → 재실행 시 세션 복구되는지 확인
- [ ] 오프라인 동작 (세션 저장 실패 경로)
- [ ] 경계값 테스트: 최소 세션(1분 미만/0.1km 미만), 0L 세션, 위치 권한 거부

## 지금 빌드까지는 가능한 것 (안드로이드만)

- [ ] 안드로이드 `eas build`는 Play Console 계정 없이도 서명/빌드 가능 — EAS가
      자체 keystore로 관리함. 수요일에 "앱 생성 → 바로 업로드"가 되도록 미리
      빌드해두기
- [ ] iOS 프로덕션 빌드는 수요일까지 불가 — 코드 서명에 Apple Developer 멤버십이
      필요해서 계정 없이는 EAS build 자체가 실패함

---

## 계정 생겨야만 가능한 것 (수요일 이후)

- [ ] Apple Developer Program 가입 ($99/년)
- [ ] Google Play Console 가입 ($25 1회) — **이걸 제일 먼저**, 14일 closed
      testing 타이머가 여기서부터 시작됨
- [ ] App Store Connect: 앱 레코드 생성
- [ ] Google Play: 앱 생성, closed testing 시작
- [ ] iOS 프로덕션 빌드 서명 (Apple 인증서/프로파일 필요)
- [ ] App Privacy 라벨(App Store) / Data safety 폼(Play) — 각 콘솔 안에서만
      작성 가능, 미리 준비 불가
- [ ] 콘텐츠 등급 설문, 연령 등급
- [ ] 스토어 리스팅 업로드 (스크린샷/설명 — 내용은 미리 준비해뒀으니 리스팅만
      생기면 바로 업로드)
- [ ] 위치 권한 선언 + 데모 영상 업로드 (Play Console)
