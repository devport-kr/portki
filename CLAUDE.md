# portki public-agent instructions for Claude Code

## Role

이 저장소는 공개 GitHub 저장소를 읽고 한국어 위키를 생성하는 devport용 에이전트 런타임입니다. `src/agent.ts`는 기계적인 파이프라인만 담당하고, 실제 이해와 작성은 에이전트가 수행합니다.

외부 LLM API를 호출하지 마십시오. OpenAI나 Anthropic API를 별도로 사용하지 않습니다.

## Public Branch Rules

- 이 브랜치는 **공개 버전**입니다.
- DB, 임베딩, PostgreSQL, OpenAI API 의존성은 없습니다.
- `.env` 설정 없이 동작해야 합니다.
- 최종 결과는 `devport-output/wiki/{owner}/{repo}/` 아래의 Markdown 파일입니다.
- `persist-section`은 로컬 검증과 세션 업데이트만 수행합니다.
- `finalize`는 전체 위키를 Markdown 번들로 씁니다.
- `package`는 모놀리식 입력을 같은 Markdown 번들로 씁니다.

## Only Use `src/agent.ts`

사용 가능한 명령은 다음뿐입니다.

- `ingest`
- `detect`
- `package`
- `plan-sections`
- `validate-plan`
- `persist-section`
- `finalize`

## Required Flow

권장 청크 흐름:

1. `ingest`
2. `plan-sections`
3. 에이전트가 `section-plan.json` 작성
4. `validate-plan`
5. 섹션별 `section-N-output.json` 작성
6. 각 섹션마다 `persist-section`
7. `finalize --advance_baseline`

작은 저장소에서는 다음 대안도 가능합니다.

1. `ingest`
2. 에이전트가 `accepted-output.json` 작성
3. `package --advance_baseline`

## Public Repo Assumption

- `GITHUB_TOKEN` 없이 public repo 기준으로 동작합니다.
- private repo 지원은 이 브랜치 범위가 아닙니다.

## Workspace Naming Rule

AI가 직접 쓰는 중간 파일은 항상 `devport-output/workspace/` 아래에 repo slug 접두사를 붙여 저장합니다.

예시:

- `devport-output/workspace/redis-artifact.json`
- `devport-output/workspace/redis-section-plan.json`
- `devport-output/workspace/redis-section-2-output.json`

## Commands

### `ingest`

```bash
npx tsx src/agent.ts ingest --repo owner/repo --out devport-output/workspace/{repo-slug}-artifact.json
```

반드시 읽을 필드:

- `ingest_run_id`
- `commit_sha`
- `repo_ref`
- `snapshot_path`
- `files_scanned`
- `metadata.key_paths`
- `metadata.language_mix`

### `detect`

```bash
npx tsx src/agent.ts detect --repo owner/repo
```

- `noop`: 중단
- `incremental`: 영향받은 섹션만 재생성
- `full-rebuild`: 전체 재생성

### `plan-sections`

```bash
npx tsx src/agent.ts plan-sections --artifact devport-output/workspace/{repo-slug}-artifact.json --out devport-output/workspace/{repo-slug}-plan-context.json
```

### `validate-plan`

```bash
npx tsx src/agent.ts validate-plan --input devport-output/workspace/{repo-slug}-section-plan.json --context devport-output/workspace/{repo-slug}-plan-context.json --out devport-output/workspace/{repo-slug}-section-plan.json
```

### `persist-section`

```bash
npx tsx src/agent.ts persist-section --plan devport-output/workspace/{repo-slug}-section-plan.json --section sec-1 --input devport-output/workspace/{repo-slug}-section-1-output.json
```

수행 내용:

- 섹션 JSON 검증
- 본문 길이/중복/머메이드/소스 경로 검증
- 로컬 `session.json` 업데이트

하지 않는 일:

- DB 저장
- 임베딩 생성
- 외부 API 호출

### `finalize`

```bash
npx tsx src/agent.ts finalize --plan devport-output/workspace/{repo-slug}-section-plan.json --advance_baseline
```

출력:

- `devport-output/wiki/{owner}/{repo}/README.md`
- `devport-output/wiki/{owner}/{repo}/01-sec-1.md`
- 추가 섹션 Markdown 파일들

### `package`

```bash
npx tsx src/agent.ts package --input devport-output/workspace/{repo-slug}-accepted-output.json --advance_baseline
```

모놀리식 입력을 검증하고 같은 Markdown 결과물을 생성합니다.

## Writing Rules

- 실제 스냅샷 파일만 근거로 사용합니다.
- 모든 한국어 문장은 **합니다체**를 사용합니다.
- 4~6개 섹션을 권장합니다.
- 섹션당 서브섹션 최소 3개가 필요합니다.
- 각 `bodyKo`는 최소 3,000자입니다.
- 최소 한 곳에 Mermaid 아키텍처 블록을 넣어야 합니다.
- `sourcePaths`는 실제 파일 경로여야 합니다.
- 패딩 목적의 반복 문장이나 반복 블록을 쓰지 마십시오.

## `sub-1-1` Override

`sub-1-1`은 프로젝트 소개용 요약입니다.

- 프로젝트 목적
- 문제 정의
- 시작 방법
- 이후 섹션 안내

코드 호출 순서 분석은 `sub-1-2` 이후에 둡니다.

## Output Paths

```text
devport-output/
  workspace/
  snapshots/{owner}/{repo}/
  chunked/{owner}/{repo}/session.json
  wiki/{owner}/{repo}/
  freshness/state.json
```
