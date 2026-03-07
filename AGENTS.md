# portki public-agent instructions

## Role

이 저장소는 공개 GitHub 저장소를 읽고 한국어 위키를 생성하는 devport용 에이전트 런타임입니다. `src/agent.ts`는 기계적인 파이프라인만 담당하고, 실제 이해와 작성은 에이전트가 수행합니다.

외부 LLM API를 호출하지 마십시오. OpenAI나 Anthropic API를 추가로 쓰지 않습니다.

## Public Branch Rules

- 이 브랜치는 **공개 버전**입니다.
- DB, 임베딩, PostgreSQL, OpenAI API 의존성은 없습니다.
- `.env` 설정 없이 동작해야 합니다.
- 최종 산출물은 `devport-output/wiki/{owner}/{repo}/` 아래의 **Markdown 파일**입니다.
- `persist-section`은 DB 저장이 아니라 **로컬 검증 + 세션 등록**입니다.
- `finalize`는 모든 섹션을 모아 **Markdown 위키 번들**을 씁니다.
- `package`는 모놀리식 입력을 바로 Markdown 위키로 내보내는 대안 경로입니다.

## Only Use `src/agent.ts`

사용 가능한 명령은 다음뿐입니다.

- `ingest`
- `detect`
- `package`
- `plan-sections`
- `validate-plan`
- `persist-section`
- `finalize`

레거시 CLI나 다른 엔트리포인트는 사용하지 마십시오.

## Required End-to-End Flow

청크 방식 기본 흐름:

1. `ingest`
2. `plan-sections`
3. 에이전트가 `section-plan.json` 작성
4. `validate-plan`
5. 섹션별 `section-N-output.json` 작성
6. 각 섹션마다 `persist-section`
7. `finalize --advance_baseline`

모놀리식 대안:

1. `ingest`
2. 에이전트가 `accepted-output.json` 작성
3. `package --advance_baseline`

## Public Repo Assumption

- 기본 대상은 public repo입니다.
- `GITHUB_TOKEN`을 요구하지 않습니다.
- private repo 지원은 이 브랜치의 범위가 아닙니다.

## Workspace Naming Rule

여러 저장소를 동시에 처리할 수 있으므로, AI가 직접 쓰는 중간 파일은 항상 `devport-output/workspace/`에 두고 repo slug 접두사를 붙입니다.

예시:

- `devport-output/workspace/ollama-artifact.json`
- `devport-output/workspace/ollama-section-plan.json`
- `devport-output/workspace/ollama-section-1-output.json`

## Commands

### `ingest`

```bash
npx tsx src/agent.ts ingest --repo owner/repo --out devport-output/workspace/{repo-slug}-artifact.json
```

에이전트가 반드시 읽어야 할 값:

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

반환 상태:

- `noop`: 아무것도 하지 않습니다.
- `incremental`: `impacted_section_ids`만 다시 생성합니다.
- `full-rebuild`: 전부 다시 생성합니다.

### `plan-sections`

```bash
npx tsx src/agent.ts plan-sections --artifact devport-output/workspace/{repo-slug}-artifact.json --out devport-output/workspace/{repo-slug}-plan-context.json
```

출력에는 다음이 들어 있습니다.

- `profile`
- `readmeExcerpt`
- `keyPaths`
- `fileTree`
- `constraints`

### `validate-plan`

```bash
npx tsx src/agent.ts validate-plan --input devport-output/workspace/{repo-slug}-section-plan.json --context devport-output/workspace/{repo-slug}-plan-context.json --out devport-output/workspace/{repo-slug}-section-plan.json
```

### `persist-section`

```bash
npx tsx src/agent.ts persist-section --plan devport-output/workspace/{repo-slug}-section-plan.json --section sec-1 --input devport-output/workspace/{repo-slug}-section-1-output.json
```

이 명령은 다음만 수행합니다.

- 섹션 JSON 스키마 검증
- 본문 길이/중복/머메이드/소스 경로 검증
- `session.json` 갱신

DB 저장, 임베딩 생성, 외부 API 호출은 없습니다.

### `finalize`

```bash
npx tsx src/agent.ts finalize --plan devport-output/workspace/{repo-slug}-section-plan.json --advance_baseline
```

이 명령은 다음을 수행합니다.

- 섹션 간 반복 검증
- 세션에 등록된 섹션 조립
- `devport-output/wiki/{owner}/{repo}/README.md`
- `devport-output/wiki/{owner}/{repo}/01-sec-1.md` 같은 섹션 Markdown 파일 생성
- 필요 시 freshness baseline 갱신

### `package`

```bash
npx tsx src/agent.ts package --input devport-output/workspace/{repo-slug}-accepted-output.json --advance_baseline
```

이 명령은 모놀리식 입력을 검증한 뒤 같은 Markdown 위키 번들을 생성합니다.

## Section Writing Rules

- 실제 스냅샷 파일을 읽고 작성합니다.
- 모든 한국어 문장은 **합니다체**를 사용합니다.
- 최소 4개, 최대 6개 섹션을 권장합니다.
- 섹션마다 서브섹션이 최소 3개여야 합니다.
- 각 `bodyKo`는 최소 3,000자입니다.
- 최소 한 곳에는 아키텍처 Mermaid 블록이 있어야 합니다.
- `sourcePaths`는 실제 스냅샷 안에 존재하는 경로여야 합니다.
- 같은 문장이나 같은 긴 블록을 반복해서 패딩하지 마십시오.

## `sub-1-1` Override

`sub-1-1`은 프로젝트 입문 요약입니다.

- 코드 호출 흐름보다 프로젝트 목적과 시작 방법을 설명합니다.
- 설치/실행/읽기 순서를 포함합니다.
- 위키 나머지 섹션이 무엇을 다루는지 짧게 안내합니다.

## Output Shape

섹션별 출력:

```json
{
  "sectionId": "sec-1",
  "titleKo": "프로젝트 개요",
  "summaryKo": "이 섹션은 ... 설명합니다.",
  "sourcePaths": ["README.md", "src/main.ts"],
  "subsections": [
    {
      "sectionId": "sec-1",
      "subsectionId": "sub-1-1",
      "titleKo": "프로젝트 소개와 개요",
      "bodyKo": "..."
    }
  ]
}
```

최종 결과는 JSON 배달물이 아니라 Markdown 파일입니다.

## Output Paths

```text
devport-output/
  workspace/
  snapshots/{owner}/{repo}/
  chunked/{owner}/{repo}/session.json
  wiki/{owner}/{repo}/
  freshness/state.json
```
