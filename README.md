# 1분 던전 RE
**짧은 탐험, 깊은 선택.** 원작의 반복 성장 루프를 분기 탐험과 적 의도 기반 전투로 다시 만든 정적 웹게임입니다.

## 바로 플레이
`index.html`을 브라우저로 열면 됩니다. 배포 번들 `dist/game.js`가 포함되어 있어 설치·빌드·서버가 필요 없습니다. GitHub Pages에는 저장소 루트를 배포하세요. 모든 리소스는 상대 경로입니다.

개발 미리보기:
```sh
npm ci
npm run build
npm run serve
```
브라우저에서 http://127.0.0.1:4173 접속. PowerShell 실행 정책이 npm.ps1을 막으면 `npm.cmd`를 사용하세요.

## 조작
- 클래스 선택 → 던전 입장 → 다음 구간 선택.
- 공격: 자원 +1. 스킬: 클래스별 효과. 방어: 피해 75% 감소, 상태 정화, 자원 회복, 다음 타격 강화.
- 물약: HP 40% 회복과 정화. 한 턴 소모.
- 키보드 1 / 2 / 3 / 4 = 공격 / 스킬 / 방어 / 물약. Tab, Enter, Esc 지원.
- 적의 다음 행동과 방어 전 피해량을 확인하세요. 방어가 필요 없는 빈틈에는 공격하세요.
- 매 행동 자동 저장. 타이틀의 이어하기로 복원. 보스 처치·사망·귀환 후 골드와 장비는 유지됩니다.
- 4·7구간 유물은 이번 판에만 적용됩니다. 장비는 가방에서 직접 바꿀 수 있습니다.
- 상점은 이번 탐험에서 얻은 골드를 사용합니다. 영구 성장은 귀환 후 보유 골드로 구매합니다.

## 리메이크 범위
3클래스, 9구간 분기 지도, 일반 적 2종·정예 2종·보스 1종, 장비 7종, 유물 6종과 시너지, 6개 성장 항목, 도감·업적, 4단계 선택 난도. 한 판 3~5분은 목표이며 선택 속도와 빌드에 따라 더 짧을 수 있습니다.

생성 아트 7종을 WebP로 연결했습니다. 총 로딩 이미지 약 0.93MB. 일반 적과 보스는 정적 일러스트에 공격·피격·숫자 연출을 적용합니다. 일부 생성 적 이미지의 배경은 투명하지 않아 화면에서 가장자리를 부드럽게 처리했습니다.

## 저장
새 키는 `omd_save_v2`. 기존 `omd_save_v1`, `omd_run_v1`은 삭제하거나 수정하지 않습니다. 구버전의 영구 진행은 가능한 범위에서 변환하고 원본 스냅샷을 보관합니다. 구버전 진행 중 탐험은 이식하지 않습니다. 자세한 정책은 [SAVE_MIGRATION](docs/SAVE_MIGRATION.md)을 참고하세요.

저장은 브라우저와 출처별로 분리됩니다. 파일 직접 실행과 localhost, GitHub Pages 사이에 자동 동기화되지 않습니다. 도움말에서 세이브 JSON을 내려받거나 가져올 수 있습니다. V2 백업 파일(최대 5MB)을 선택하고 미리보기를 확인한 뒤 복원하세요. 복원 전 기록은 별도 보관되며 도움말에서 내려받을 수 있습니다.

## 코드 구조
```text
src/data/content.js        콘텐츠 정의
src/systems/combat.js      순수 턴 처리, 예고, 상태이상
src/systems/dungeon.js     경로, 방 선택, 비전투 이벤트
src/systems/progression.js 장비·성장·결과 정산
src/systems/save.js        검증·마이그레이션·저장
src/systems/session.js     다중 탭 저장 순서와 최신 기록 확인
src/systems/random.js      저장 가능한 결정적 RNG
src/systems/audio.js       사용자 입력 이후 합성 효과음
src/ui/screens.js         화면과 모달 템플릿
src/main.js               이벤트·저장·화면 연결
dist/game.js              파일 직접 실행용 생성 번들
assets/                   실제 WebP와 생성 PNG 원본
tests/                    Node 및 브라우저 테스트
tools/                    빌드·미리보기·최적화·밸런스
docs/                     설계·아트·마이그레이션·검증
```
원작의 `game.js`, `style-desktop.css`는 비교 참고용으로 남겨두었으며 새 index에서 로드하지 않습니다. 원본 전체는 main 브랜치에 있습니다.

소스를 바꾼 뒤 반드시 `npm run build`로 번들을 갱신하세요. 빌더는 현재 프로젝트의 단일 행 named import/export 형태만 지원합니다. 임의의 외부 패키지를 런타임 소스에 추가하려면 빌드 방식을 변경해야 합니다.

## 검증
```sh
npm test
npm run test:browser
npm run balance
```
브라우저 테스트는 설치된 Microsoft Edge를 사용합니다. 환경에 따라 `playwright.config.js`의 channel을 변경하세요. 검증 범위와 한계는 [검증 보고서](docs/VERIFICATION.md)에 기록합니다.

## 문서
[리메이크 계획](docs/REMAKE_PLAN.md) · [게임 설계](docs/GAME_DESIGN.md) · [아트 방향](docs/ART_DIRECTION.md) · [UI 디자인](docs/UI_DESIGN.md) · [생성 에셋](docs/ASSETS.md) · [작업 인계](PROJECT_HANDOFF.md)

성장 단계별 클래스 조정과 재현 조건은 [밸런스 보고서](docs/BALANCE_REPORT.md)를 참고하세요. `npm run balance`는 5단계 성장·4단계 난도·2개 전략을 비교합니다.
