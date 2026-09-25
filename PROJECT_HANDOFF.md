# 1분 던전 RE 인계
작업 브랜치: remake/one-minute-dungeon-re. 원본 전체는 main에 보존. 이 문서는 리메이크에서 새로 작성했으며 원본에는 없었다.

index.html은 dist/game.js만 실행한다. src/는 ES Modules, tools/build.js가 파일 직접 실행용 번들을 만든다. 소스 변경 뒤 npm run build 필수. 런타임 외부 의존성 없음. 개발 의존성은 Playwright와 sharp.

상태 변경은 src/systems/, 표시/입력은 src/ui와 main.js에 둔다. 턴 처리와 보상은 동기적으로 끝낸 뒤 하나의 세이브로 저장한다. 애니메이션 타이머에 게임 상태를 넣지 않는다.

테스트: npm test, npm run test:browser. 기본 브라우저 Edge. 테스트 스크린샷은 test-results/screenshots (git 제외). 원본 game.js/style-desktop.css는 비교용이며 로드하지 않는다.

설계: docs/REMAKE_PLAN.md, GAME_DESIGN.md, ART_DIRECTION.md, UI_DESIGN.md, SAVE_MIGRATION.md.
제약/후속: docs/VERIFICATION.md 참조. 배포/푸시/커밋은 수행하지 않음.

## 후속 작업: 백업 복원 완료
도움말에 V2 백업 가져오기·미리보기·복원 전 기록 다운로드를 추가했다. src/systems/save.js의 parseImport/restoreImport가 검증 및 백업 후 교체를 처리하며, 비동기 파일 읽기는 모달을 닫으면 무효화한다. tests/import.test.js와 tests/browser/import.spec.js에 회귀 테스트를 추가했다. 빌드 갱신 완료, Node 15/15 및 Edge 10/10 통과.

다중 탭 저장 충돌 방지는 아래 후속 작업에서 완료했다. 성장 단계별 클래스 밸런스 검증도 아래 후속 작업에서 완료했다. 다음 우선순위는 적/보스 콘텐츠 확장과 후반 성장용 도전 난도다.

## 후속 작업: 다중 탭 저장 충돌 방지
src/systems/session.js에 공유 Web Lock과 저장 원문 비교를 추가했다. 초기 저장부터 행동/설정/백업 복원까지 같은 잠금을 사용한다. 오래된 탭은 입력을 차단하고 최신 기록 불러오기 또는 현재 탭 백업을 제공한다. storage 이벤트 누락에도 행동 전에 확인하며 삭제/clear도 감지한다. 비동기 파일 읽기와 백업 미리보기는 충돌 시 취소된다. 조회와 이어하기 화면 전환은 즉시 처리한다.

브라우저 테스트에서 저장을 읽을 때 같은 잠금으로 완료를 기다려야 한다. tests/browser/session.spec.js가 실제 다중 탭, 잠금 대기 상태 동시 입력, storage 이벤트 누락, 삭제/clear, Web Locks 미지원 경로를 검증한다. 기존 세이브 스키마와 백업 형식은 유지한다. 미지원 환경과 구버전 탭 등 잠금을 공유하지 않는 쓰기의 한계는 docs/SAVE_MIGRATION.md 참조.

최종 검증: Node 17/17, Edge 14/14(33.9초), 번들 빌드/구문 검사 통과. 320px 모바일 충돌 안내 직접 시각 확인 완료.

## 후속 작업: 성장 단계별 클래스 밸런스 완료
전사 방패 강타 감소율 40%, 도적 HP 98/방어 2/스킬 170%, 마법사 HP 90/방어 2로 조정했다. 스킬 배율과 전사 감소율은 content.js 데이터에서 관리한다. 세이브 스키마와 성장 비용은 유지한다.

tools/balance-sim.js에 5단계 투자/장비 프로필, 2개 전략, 안전/정예 경로를 정의했다. tools/balance.js에 시드/표본/시작 장비 옵션을 추가했다. tools/balance-compare.js로 조정 전 클래스 스냅샷과 현재 값을 별도 시드에서 비교한다. docs/balance-before*.json은 이전 수치 기준이므로 덮어쓰지 않는다. 상세 조건·전후 결과·남은 한계는 docs/BALANCE_REPORT.md.

빌드 완료, Node 20/20, Edge 14/14(36.2초) 통과. 무성장 최고 난도에서 생존형 클래스 우위와 후반 성장 후 도전성 부족은 남아 있다. 콘텐츠 확장 시 기존 4개 난도를 무조건 상향하기보다 후반용 적/보스 패턴과 선택 도전을 별도로 검토한다.
