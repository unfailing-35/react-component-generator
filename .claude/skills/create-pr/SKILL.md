---
name: create-pr
description: 현재 브랜치의 변경사항을 분석해 템플릿에 맞는 본문으로 GitHub PR을 생성한다. "PR 만들어줘", "PR 생성", "풀리퀘스트 올려줘", "create pr" 요청 시 사용한다.
context: fork
agent: general-purpose
---

# create-pr

별도 agent(분리된 컨텍스트)에서 실행된다. 메인 대화의 내용은 보이지 않으므로, 필요한 정보는 `git`과 `gh`로 직접 수집한다. 사용자가 추가 인자로 넘긴 내용(제목, base 브랜치, 강조점 등)이 있으면 반영한다.

## 절차

1. **사전 확인**
   - `git branch --show-current`로 현재 브랜치를 확인한다. base 브랜치(기본 `main`)와 같다면 PR을 만들지 않고 중단해 그 이유를 보고한다.
   - `git status --short`에 미커밋 변경이 있으면 PR을 만들지 않고 목록을 보고한다. 커밋은 `commit` 스킬로 먼저 하도록 안내한다.
   - `gh auth status`로 로그인 상태를 확인한다.

2. **변경사항 분석**
   - `git log <base>..HEAD --oneline`과 `git diff <base>...HEAD`로 PR에 포함될 커밋과 diff 전체를 본다. 마지막 커밋만 보지 않는다.
   - 변경의 목적, 주요 변경 내용, 테스트 여부를 파악한다. diff에서 확인하지 못한 테스트 결과는 적지 않는다.

3. **템플릿 선택**
   - 프로젝트 이름을 확인한다: `gh repo view --json name -q .name` (실패 시 `package.json`의 `name`).
   - 이름이 `react-component-generator`이면 한국어 템플릿 `references/pr-template.ko.md`, 그 외에는 영문 템플릿 `references/pr-template.en.md`를 사용한다.
   - 템플릿 경로는 이 스킬 디렉토리 기준 상대 경로다.

4. **PR 작성**
   - 제목: 70자 이내, 커밋 컨벤션과 같은 `type: 요약` 형식. 템플릿 언어와 같은 언어로 쓴다.
   - 본문: 선택한 템플릿의 섹션 구조를 그대로 채운다. 섹션을 삭제하거나 순서를 바꾸지 않는다. 해당 없는 섹션은 "해당 없음"(영문은 "N/A")으로 둔다.
   - 본문 마지막에 시스템이 지정한 PR 속성 줄이 있으면 그대로 덧붙인다.

5. **푸시 및 생성**
   - 원격에 브랜치가 없거나 뒤처져 있으면 `git push -u origin <branch>`로 푸시한다. `--force`는 사용하지 않는다.
   - `gh pr create --base <base> --title "<제목>" --body-file <임시 파일>`로 생성한다. 본문은 heredoc/파일로 전달해 줄바꿈이 깨지지 않게 한다.
   - 이미 같은 브랜치의 열린 PR이 있으면(`gh pr view`) 새로 만들지 않고 해당 URL을 보고한다.

6. **결과 보고**
   - 생성된 PR URL, 제목, 사용한 템플릿 언어를 간결하게 보고한다.

## 주의

- 비밀 값(API 키, `.env` 내용)이 diff에 보이면 PR을 만들지 않고 보고한다.
- `gh pr create`는 외부에 공개되는 동작이다. 사용자가 이 스킬을 호출해 PR 생성을 요청한 경우에만 실행한다.
- 템플릿 파일은 `references/`에서만 관리한다. 본문 구조를 바꾸고 싶으면 SKILL.md가 아니라 템플릿을 수정한다.
