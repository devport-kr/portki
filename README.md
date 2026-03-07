# portki (포트키)

**portki**는 **ports** + **wiki** 의 합성어로 ['포트키(Portkey)'](https://en.wikipedia.org/wiki/Magical_objects_in_Harry_Potter#Portkeys)처럼 순간이동해 다양한 AI 프로젝트를 만날 수 있는 Agent 입니다. [devport](https://devport.kr)의 [ports](https://devport.kr/ports)에 있는 모든 위키를 책임지고 있습니다.


## 주요 기능

- **GitHub 저장소 스냅샷 수집**: 저장소의 코드를 분석하기 위해 특정 커밋 시점의 스냅샷을 다운로드합니다.
- **AI 에이전트 인터페이스**: AI가 코드베이스를 직접 읽고, 분석하여 위키 문서를 작성할 수 있도록 기계적인 파이프라인(스냅샷, 변경 감지, 검증, 세션 기록, Markdown 출력 등)을 제공합니다.
- **청크 기반 생성 (Chunked Generation)**: 저장소의 규모가 클 경우, 문서를 여러 섹션으로 나누고 각 섹션 단위로 상세한 문서를 생성 및 검증한 뒤 로컬 세션 상태에 반영합니다.
- **순수 Markdown 출력**: 최종 위키를 데이터베이스가 아니라 `README.md`와 섹션별 `.md` 파일로 출력합니다.
- **증분 업데이트 (Incremental Update)**: 전체 코드를 매번 다시 분석하지 않고, 마지막 위키 생성 커밋 이후 변경된 파일과 영향을 받는 섹션만 추적하여 위키를 효율적으로 갱신합니다.

## 설치

Node.js 환경이 필요합니다.

```bash
npm install
```

공개 버전에서는 `.env`를 만들 필요가 없습니다.

출시 후에는 로컬 clone 없이도 사용할 수 있습니다.

```bash
npx @devport-kr/portki help
```

또는 전역 설치:

```bash
npm install -g @devport-kr/portki
portki help
```

## GitHub Releases

`public` 브랜치에서는 GitHub Release를 만들 수 있습니다.

- `v*` 태그를 `public` 브랜치 커밋에 push하면 Release가 자동으로 생성됩니다.
- Actions의 수동 실행(`workflow_dispatch`)으로도 Release를 만들 수 있습니다.
- Release에는 자동 생성된 노트와 함께 소스 아카이브(`.tar.gz`, `.zip`), npm 패키지 tarball(`devport-kr-portki-<version>.tgz`), SHA256 체크섬 파일이 첨부됩니다.
- npm publish workflow를 함께 켜두면 같은 `v*` 태그에서 npm 패키지도 배포할 수 있습니다.

기본 절차:

```bash
git checkout public
git pull origin public

# package.json version과 태그는 일치해야 합니다.
git tag v0.1.0
git push origin public --follow-tags
```

npm 배포까지 하려면 저장소 Secrets에 `NPM_TOKEN`을 추가해야 합니다.

## 권장 실행 환경 
**(2026년 3월 7일 기준)**
| 환경 | 권장 모델 | (Effort (Thinking) Level) | 설정 지침 |
|------|-----------|--------------------------|------------------|
| **Claude Code** | `Opus 4.6` | High | [`CLAUDE.md`](./CLAUDE.md)|
| **Codex** | `GPT-5.4` | xHigh | [`AGENTS.md`](./AGENTS.md)|
| **Gemini CLI** | `gemini 3.1-pro-preview` | High | [`AGENTS.md`](./AGENTS.md)|

## 명령어 (Commands)

모든 명령은 프로젝트 루트에서 실행합니다.

```bash
npx tsx src/agent.ts <command> [flags]
```

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

### 1. 청크 단위 위키 생성 (권장)

저장소를 분석하여 여러 섹션으로 분리한 후 각 섹션별로 코드를 깊이 있게 확인하고 작성하는 방식입니다.

```bash
# 1. 저장소 스냅샷 수집
npx tsx src/agent.ts ingest --repo owner/repo --out devport-output/workspace/{repo-slug}-artifact.json

# 2. 분석 및 섹션 계획 수립 준비 (컨텍스트 생성)
npx tsx src/agent.ts plan-sections --artifact devport-output/workspace/{repo-slug}-artifact.json --out devport-output/workspace/{repo-slug}-plan-context.json

# (AI 작업: plan-context.json과 주요 코드를 바탕으로 {repo-slug}-section-plan.json 생성)

# 3. 플랜 검증
npx tsx src/agent.ts validate-plan --input devport-output/workspace/{repo-slug}-section-plan.json --context devport-output/workspace/{repo-slug}-plan-context.json --out devport-output/workspace/{repo-slug}-section-plan.json

# 4. 각 섹션별 작성 및 세션 반영 (전체 섹션 완료 시까지 반복)
# (AI 작업: 해당 섹션의 코드를 분석하고 {repo-slug}-section-1-output.json 생성)
npx tsx src/agent.ts persist-section --plan devport-output/workspace/{repo-slug}-section-plan.json --section sec-1 --input devport-output/workspace/{repo-slug}-section-1-output.json

# 5. 최종 완성 및 증분 베이스라인 갱신
npx tsx src/agent.ts finalize --plan devport-output/workspace/{repo-slug}-section-plan.json --advance_baseline
```

`finalize`가 완료되면 `devport-output/wiki/{owner}/{repo}/README.md`와 섹션별 Markdown 파일이 생성됩니다.

### 2. 증분 업데이트 (Incremental Update)

이전에 작성 완료된 위키를 바탕으로 변경된 파일들만 식별하여 최신화합니다.

```bash
# 1. 변경사항 감지
npx tsx src/agent.ts detect --repo owner/repo
# 반환된 JSON의 status에 따라 분기:
# - noop: 변경점 없음 (수정 불필요)
# - incremental: 변경된 코드와 영향을 받는 섹션(impacted_section_ids)만 재생성
# - full-rebuild: 너무 많은 변화로 인해 전체 위키 재작성 필요

# 2. 재생성 필요 시 최신 코드로 스냅샷 다시 수집
npx tsx src/agent.ts ingest --repo owner/repo --out devport-output/workspace/{repo-slug}-artifact.json

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
