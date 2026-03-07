# portki (포트키)

**portki**는 **ports** + **wiki** 의 합성어로 ['포트키(Portkey)'](https://en.wikipedia.org/wiki/Magical_objects_in_Harry_Potter#Portkeys)처럼 순간이동해 다양한 AI 프로젝트를 만날 수 있는 Agent 입니다. [devport](https://devport.kr)의 [ports](https://devport.kr/ports)에 있는 모든 위키를 책임지고 있습니다.


## 주요 기능

- **GitHub 저장소 스냅샷 수집**: 저장소의 코드를 분석하기 위해 특정 커밋 시점의 스냅샷을 다운로드합니다.
- **AI 에이전트 인터페이스**: AI가 코드베이스를 직접 읽고, 분석하여 위키 문서를 작성할 수 있도록 기계적인 파이프라인(스냅샷, 변경 감지, 검증, 세션 기록, Markdown 출력 등)을 제공합니다.
- **청크 기반 생성 (Chunked Generation)**: 저장소의 규모가 클 경우, 문서를 여러 섹션으로 나누고 각 섹션 단위로 상세한 문서를 생성 및 검증한 뒤 로컬 세션 상태에 반영합니다.
- **순수 Markdown 출력**: 최종 위키를 데이터베이스가 아니라 `README.md`와 섹션별 `.md` 파일로 출력합니다.
- **증분 업데이트 (Incremental Update)**: 전체 코드를 매번 다시 분석하지 않고, 마지막 위키 생성 커밋 이후 변경된 파일과 영향을 받는 섹션만 추적하여 위키를 효율적으로 갱신합니다.
- **AI 에이전트 원클릭 통합**: Claude Code, Codex, Gemini CLI에서 한 줄의 명령으로 위키를 생성할 수 있습니다.

## 빠른 시작 (Quick Start)

```bash
npx @devport-kr/portki facebook/react
```

이 한 줄이면 저장소를 분석하고 `handoff.md`를 생성합니다. AI 에이전트가 이 파일을 읽고 위키를 완성합니다.

## 설치

Node.js 20 이상이 필요합니다. `.env` 설정은 필요 없습니다.

```bash
npx @devport-kr/portki help
```

또는 전역 설치:

```bash
npm install -g @devport-kr/portki
portki help
```

환경 상태를 확인하려면:

```bash
portki doctor
```

## AI 에이전트에서 사용하기

portki는 AI 코딩 에이전트와 함께 사용하도록 설계되었습니다. `portki owner/repo`를 실행하면 에이전트가 따라갈 수 있는 `handoff.md`가 생성됩니다. 각 에이전트 환경에 맞는 어댑터를 설치하면 더 편리하게 사용할 수 있습니다.

### Claude Code

```bash
# 1. 어댑터 설치 (프로젝트 루트에서 한 번만)
portki install --agent claude

# 2. Claude Code에서 슬래시 명령으로 실행
/portki facebook/react
```

`portki install --agent claude`는 `.claude/commands/portki.md`를 생성합니다. 이후 Claude Code에서 `/portki owner/repo`를 입력하면 portki가 저장소를 분석하고 handoff.md를 생성한 뒤, Claude가 그 지침에 따라 위키를 완성합니다.

어댑터 없이 직접 사용할 수도 있습니다:

```bash
# Claude Code 터미널에서 직접 실행
portki facebook/react
# → handoff.md 경로가 출력됨. Claude에게 해당 파일을 읽고 따라달라고 요청
```

### Codex (OpenAI)

```bash
# 1. 어댑터 설치 (프로젝트 루트에서 한 번만)
portki install --agent codex
```

이 명령은 현재 프로젝트의 `AGENTS.md`에 portki 사용법 섹션을 추가합니다. Codex가 해당 파일을 자동으로 읽어 portki 명령어를 사용할 수 있게 됩니다.

Codex에서 사용 예시:

```
portki facebook/react 실행하고 handoff.md 따라서 위키 만들어줘
```

### Gemini CLI

```bash
# 1. 어댑터 설치 (프로젝트 루트에서 한 번만)
portki install --agent gemini

# 2. Gemini에서 슬래시 명령으로 실행
/portki facebook/react
```

`portki install --agent gemini`는 `.gemini/commands/portki.md`를 생성합니다. 이후 Gemini CLI에서 `/portki owner/repo`를 입력하면 동일한 handoff 흐름이 시작됩니다.

### 공통 워크플로우

어떤 에이전트를 사용하든 내부 흐름은 동일합니다:

1. `portki owner/repo` — 저장소 스냅샷 수집 + 분석 컨텍스트 생성 + `handoff.md` 생성
2. AI 에이전트가 `handoff.md`를 읽고 단계별 지침을 따름
3. 에이전트가 `section-plan.json` 작성 → `validate-plan` 실행
4. 각 섹션을 작성하고 `persist-section`으로 검증
5. `finalize`로 최종 Markdown 위키 조립

진행 상황은 언제든 확인할 수 있습니다:

```bash
portki status owner/repo
```

중단된 작업을 이어서 하려면:

```bash
portki resume owner/repo
```

## 권장 실행 환경
**(2026년 3월 7일 기준)**
| 환경 | 권장 모델 | Effort (Thinking) Level | 설정 지침 |
|------|-----------|--------------------------|------------------|
| **Claude Code** | `Opus 4.6` | High | [`CLAUDE.md`](./CLAUDE.md)|
| **Codex** | `GPT-5.4` | xHigh | [`AGENTS.md`](./AGENTS.md)|
| **Gemini CLI** | `gemini 3.1-pro-preview` | High | [`AGENTS.md`](./AGENTS.md)|

## 명령어 (Commands)

### 상위 명령어 (High-level)

| 명령 | 설명 |
|------|------|
| `portki owner/repo` | 저장소를 분석하고 AI 에이전트용 handoff.md를 생성합니다. |
| `portki status owner/repo` | 파이프라인 진행 상황을 표시합니다. |
| `portki resume owner/repo` | 마지막 유효 단계에서 handoff를 재생성합니다. |
| `portki doctor` | 실행 환경 상태를 점검합니다. |
| `portki install --agent <name>` | AI 에이전트 어댑터를 설치합니다. (`claude`, `codex`, `gemini`) |

### 하위 명령어 (Low-level)

| 명령 | 설명 |
|------|------|
| `ingest` | 저장소 스냅샷을 수집하고 분석용 메타데이터(`artifact.json`)를 생성합니다. |
| `plan-sections` | 저장소 구조를 분석하여 섹션별 작성 계획을 위한 컨텍스트와 중점 분석 대상 파일 목록을 제공합니다. |
| `validate-plan` | AI가 생성한 섹션 플랜의 정합성(스키마, 조건 등)을 검증합니다. |
| `persist-section` | 생성된 단일 섹션의 품질을 검증하고, 허용되면 로컬 세션 상태에 반영합니다. |
| `finalize` | 작성 완료된 모든 섹션 간의 교차 검증을 수행하고, 최종 Markdown 위키와 기준점을 업데이트합니다. |
| `package` | 위키 결과물 규격을 검증하고 순수 Markdown 위키 번들로 출력합니다. |
| `detect` | 마지막 배포 시점과 현재 저장소의 변경 사항을 비교하여 증분 업데이트 필요 여부와 대상 섹션을 파악합니다. |

## 워크플로우

이 도구는 AI 에이전트가 위키 문서를 더 정확하고 꼼꼼하게 작성하도록 **청크 단위 작업**을 권장합니다.

### 1. AI 에이전트 워크플로우 (권장)

가장 간단한 방식입니다. portki가 분석을 자동화하고, AI 에이전트가 handoff.md를 따라 문서를 작성합니다.

```bash
# 1. 저장소 분석 + handoff 생성
portki owner/repo

# 2. AI 에이전트가 handoff.md를 읽고 위키 완성
#    (에이전트가 validate-plan, persist-section, finalize를 자동으로 실행)

# 3. 진행 상황 확인 (선택)
portki status owner/repo

# 4. 중단 시 복구 (선택)
portki resume owner/repo
```

### 2. 수동 청크 단위 위키 생성

저장소를 분석하여 여러 섹션으로 분리한 후 각 섹션별로 코드를 깊이 있게 확인하고 작성하는 방식입니다.

```bash
# 1. 저장소 스냅샷 수집
portki ingest --repo owner/repo --out devport-output/workspace/{repo-slug}-artifact.json

# 2. 분석 및 섹션 계획 수립 준비 (컨텍스트 생성)
portki plan-sections --artifact devport-output/workspace/{repo-slug}-artifact.json --out devport-output/workspace/{repo-slug}-plan-context.json

# (AI 작업: plan-context.json과 주요 코드를 바탕으로 {repo-slug}-section-plan.json 생성)

# 3. 플랜 검증
portki validate-plan --input devport-output/workspace/{repo-slug}-section-plan.json --context devport-output/workspace/{repo-slug}-plan-context.json --out devport-output/workspace/{repo-slug}-section-plan.json

# 4. 각 섹션별 작성 및 세션 반영 (전체 섹션 완료 시까지 반복)
# (AI 작업: 해당 섹션의 코드를 분석하고 {repo-slug}-section-1-output.json 생성)
portki persist-section --plan devport-output/workspace/{repo-slug}-section-plan.json --section sec-1 --input devport-output/workspace/{repo-slug}-section-1-output.json

# 5. 최종 완성 및 증분 베이스라인 갱신
portki finalize --plan devport-output/workspace/{repo-slug}-section-plan.json --advance_baseline
```

`finalize`가 완료되면 `devport-output/wiki/{owner}/{repo}/README.md`와 섹션별 Markdown 파일이 생성됩니다.

### 3. 증분 업데이트 (Incremental Update)

이전에 작성 완료된 위키를 바탕으로 변경된 파일들만 식별하여 최신화합니다.

```bash
# 1. 변경사항 감지
portki detect --repo owner/repo
# 반환된 JSON의 status에 따라 분기:
# - noop: 변경점 없음 (수정 불필요)
# - incremental: 변경된 코드와 영향을 받는 섹션(impacted_section_ids)만 재생성
# - full-rebuild: 너무 많은 변화로 인해 전체 위키 재작성 필요

# 2. 재생성 필요 시 최신 코드로 스냅샷 다시 수집
portki ingest --repo owner/repo --out devport-output/workspace/{repo-slug}-artifact.json

# (이후 영향을 받는 섹션만 다시 작성하여 persist-section 후 finalize 수행)
```

## 출력 경로 (File Layout)

작업 중에 AI가 생성한 임시 파일과 파이프라인이 생성한 모든 데이터는 프로젝트 루트를 오염시키지 않도록 `devport-output/` 내부에 기록됩니다. (이 디렉터리는 `.gitignore`에 포함되어 있습니다.)

```text
devport-output/
  workspace/                    # AI 에이전트가 중간에 생성하고 읽는 작업 파일 ({repo-slug}-*.json)
  snapshots/{owner}/{repo}/     # 다운로드된 코드 스냅샷 원본 (절대 직접 수정 금지)
  wiki/{owner}/{repo}/          # 최종 Markdown 위키 출력
  chunked/{owner}/{repo}/       # 진행 중인 섹션별 작업 및 세션 상태 보관 파일
  freshness/state.json          # 증분 업데이트 감지 시 사용하는 마지막 베이스라인 상태 파일
```
