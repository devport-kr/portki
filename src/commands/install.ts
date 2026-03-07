/**
 * src/commands/install.ts — `portki install --agent claude|codex|gemini`
 *
 * Installs agent adapter files for AI coding assistants.
 */

import { mkdir, writeFile, readFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const CLAUDE_TEMPLATE = `# portki — Generate Korean Wiki

GitHub 저장소의 한국어 위키를 생성합니다.

## 실행

\`\`\`
portki $ARGUMENTS
\`\`\`

## 실행 후 해야 할 일

portki를 실행하면 stdout에 handoff.md 경로가 출력됩니다. 반드시 아래 순서를 따르세요:

1. **handoff.md를 읽습니다.** 파이프라인 상태, 저장소 프로필, 스냅샷 경로, 작성 규칙이 모두 들어 있습니다.
2. **스냅샷의 주요 소스 파일을 읽습니다.** handoff.md의 "Key Paths to Read" 섹션에 나열된 파일들을 우선으로 읽으세요.
3. **section-plan.json을 작성합니다.** handoff.md의 경로와 스키마를 따르세요. 4~6개 섹션, 각 섹션 3개 이상의 서브섹션.
4. **\`portki validate-plan\`을 실행합니다.** handoff.md에 적힌 정확한 명령어를 사용하세요.
5. **각 섹션을 작성합니다.** 섹션 플랜의 focusPaths에 있는 파일들을 읽고, section output JSON을 작성한 뒤 \`portki persist-section\`으로 검증합니다. 모든 섹션을 반복합니다.
6. **\`portki finalize\`를 실행합니다.** handoff.md에 적힌 정확한 명령어를 사용하세요.

## 작성 규칙

- 모든 한국어 문장은 \`합니다\` 체를 사용합니다.
- 각 bodyKo는 최소 3,000자 이상이어야 합니다.
- 전체 위키에 최소 하나의 Mermaid 아키텍처 블록을 포함합니다.
- sourcePaths는 반드시 스냅샷에 실제로 존재하는 경로여야 합니다.
- sub-1-1은 프로젝트 소개 요약입니다 (목적, 문제 영역, 시작 가이드, 나머지 섹션 안내).
- 코드 콜플로우 분석은 sub-1-2부터 시작합니다.
- 반복적인 필러 문장을 사용하지 마세요.
`;

const CODEX_TEMPLATE = `
## portki — Korean Wiki Generator

GitHub 저장소의 한국어 위키를 생성합니다.

### 실행

\`\`\`bash
portki owner/repo
\`\`\`

### 실행 후 해야 할 일

portki를 실행하면 stdout에 handoff.md 경로가 출력됩니다. 반드시 아래 순서를 따르세요:

1. **handoff.md를 읽습니다.** 파이프라인 상태, 저장소 프로필, 스냅샷 경로, 작성 규칙이 모두 들어 있습니다.
2. **스냅샷의 주요 소스 파일을 읽습니다.** handoff.md의 "Key Paths to Read" 섹션에 나열된 파일들을 우선으로 읽으세요.
3. **section-plan.json을 작성합니다.** handoff.md의 경로와 스키마를 따르세요. 4~6개 섹션, 각 섹션 3개 이상의 서브섹션.
4. **\`portki validate-plan\`을 실행합니다.** handoff.md에 적힌 정확한 명령어를 사용하세요.
5. **각 섹션을 작성합니다.** 섹션 플랜의 focusPaths에 있는 파일들을 읽고, section output JSON을 작성한 뒤 \`portki persist-section\`으로 검증합니다. 모든 섹션을 반복합니다.
6. **\`portki finalize\`를 실행합니다.** handoff.md에 적힌 정확한 명령어를 사용하세요.

### 보조 명령어

- \`portki status owner/repo\` — 진행 상황 확인
- \`portki resume owner/repo\` — 중단된 작업 이어서 하기

### 작성 규칙

- 모든 한국어 문장은 \`합니다\` 체를 사용합니다.
- 각 bodyKo는 최소 3,000자 이상이어야 합니다.
- 전체 위키에 최소 하나의 Mermaid 아키텍처 블록을 포함합니다.
- sourcePaths는 반드시 스냅샷에 실제로 존재하는 경로여야 합니다.
- sub-1-1은 프로젝트 소개 요약입니다 (목적, 문제 영역, 시작 가이드, 나머지 섹션 안내).
- 코드 콜플로우 분석은 sub-1-2부터 시작합니다.
- 반복적인 필러 문장을 사용하지 마세요.
`;

const GEMINI_TEMPLATE = `# portki — Generate Korean Wiki

GitHub 저장소의 한국어 위키를 생성합니다.

## 실행

\`\`\`
portki $ARGUMENTS
\`\`\`

## 실행 후 해야 할 일

portki를 실행하면 stdout에 handoff.md 경로가 출력됩니다. 반드시 아래 순서를 따르세요:

1. **handoff.md를 읽습니다.** 파이프라인 상태, 저장소 프로필, 스냅샷 경로, 작성 규칙이 모두 들어 있습니다.
2. **스냅샷의 주요 소스 파일을 읽습니다.** handoff.md의 "Key Paths to Read" 섹션에 나열된 파일들을 우선으로 읽으세요.
3. **section-plan.json을 작성합니다.** handoff.md의 경로와 스키마를 따르세요. 4~6개 섹션, 각 섹션 3개 이상의 서브섹션.
4. **\`portki validate-plan\`을 실행합니다.** handoff.md에 적힌 정확한 명령어를 사용하세요.
5. **각 섹션을 작성합니다.** 섹션 플랜의 focusPaths에 있는 파일들을 읽고, section output JSON을 작성한 뒤 \`portki persist-section\`으로 검증합니다. 모든 섹션을 반복합니다.
6. **\`portki finalize\`를 실행합니다.** handoff.md에 적힌 정확한 명령어를 사용하세요.

## 작성 규칙

- 모든 한국어 문장은 \`합니다\` 체를 사용합니다.
- 각 bodyKo는 최소 3,000자 이상이어야 합니다.
- 전체 위키에 최소 하나의 Mermaid 아키텍처 블록을 포함합니다.
- sourcePaths는 반드시 스냅샷에 실제로 존재하는 경로여야 합니다.
- sub-1-1은 프로젝트 소개 요약입니다 (목적, 문제 영역, 시작 가이드, 나머지 섹션 안내).
- 코드 콜플로우 분석은 sub-1-2부터 시작합니다.
- 반복적인 필러 문장을 사용하지 마세요.
`;

export async function installCommand(flags: Record<string, string>): Promise<void> {
  const agent = flags["agent"];
  if (!agent) {
    throw new Error("Usage: portki install --agent claude|codex|gemini");
  }

  const normalized = agent.toLowerCase();

  switch (normalized) {
    case "claude": {
      const dir = path.resolve(".claude", "commands");
      const filePath = path.join(dir, "portki.md");
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, CLAUDE_TEMPLATE, "utf8");
      process.stderr.write(`[portki] Installed Claude adapter:\n  ${filePath}\n`);
      process.stderr.write(`  Use /portki owner/repo in Claude Code.\n\n`);
      break;
    }

    case "codex": {
      const agentsFile = path.resolve("AGENTS.md");
      if (existsSync(agentsFile)) {
        const existing = await readFile(agentsFile, "utf8");
        if (existing.includes("portki")) {
          process.stderr.write(`[portki] AGENTS.md already contains portki section. Skipping.\n\n`);
          return;
        }
        await appendFile(agentsFile, CODEX_TEMPLATE, "utf8");
      } else {
        await writeFile(agentsFile, CODEX_TEMPLATE.trimStart(), "utf8");
      }
      process.stderr.write(`[portki] Installed Codex adapter:\n  ${agentsFile}\n\n`);
      break;
    }

    case "gemini": {
      const dir = path.resolve(".gemini", "commands");
      const filePath = path.join(dir, "portki.md");
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, GEMINI_TEMPLATE, "utf8");
      process.stderr.write(`[portki] Installed Gemini adapter:\n  ${filePath}\n`);
      process.stderr.write(`  Use /portki owner/repo in Gemini.\n\n`);
      break;
    }

    default:
      throw new Error(`Unknown agent: ${agent}. Supported: claude, codex, gemini`);
  }
}
