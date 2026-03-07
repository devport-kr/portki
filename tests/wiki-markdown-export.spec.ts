import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { writeMarkdownBundle } from "../src/output/markdown";

const COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567";

describe("markdown export", () => {
  it("writes README and section markdown files for a public wiki bundle", async () => {
    const root = mkdtempSync(join(tmpdir(), "devport-markdown-export-"));

    try {
      const acceptedOutput = {
        ingest_run_id: "ingest-public-1",
        repo_ref: "acme/widget",
        commit_sha: COMMIT_SHA,
        section_count: 2,
        subsection_count: 6,
        total_korean_chars: 12000,
        source_doc_count: 2,
        trend_fact_count: 1,
        draft: {
          artifactType: "wiki-draft",
          repoFullName: "acme/widget",
          commitSha: COMMIT_SHA,
          generatedAt: "2026-03-07T08:00:00.000Z",
          overviewKo: "이 위키는 공개 저장소를 기준으로 구조와 실행 흐름을 Markdown 문서로 정리합니다.",
          sourceDocs: [
            { sourceId: "src-1", path: "README.md" },
            { sourceId: "src-2", path: "src/main.ts" },
          ],
          trendFacts: [
            { factId: "trend-1", category: "release", summaryKo: "최근 릴리스 간격이 짧아졌습니다." },
          ],
          sections: [
            {
              sectionId: "sec-1",
              titleKo: "프로젝트 개요",
              summaryKo: "프로젝트의 역할과 읽기 순서를 안내합니다.",
              sourcePaths: ["README.md"],
              subsections: [
                {
                  sectionId: "sec-1",
                  subsectionId: "sub-1-1",
                  titleKo: "소개",
                  bodyKo: "README.md를 중심으로 프로젝트 목적과 시작 순서를 설명합니다.",
                },
                {
                  sectionId: "sec-1",
                  subsectionId: "sub-1-2",
                  titleKo: "핵심 기능",
                  bodyKo: "핵심 기능을 입문자 관점에서 정리합니다.",
                },
                {
                  sectionId: "sec-1",
                  subsectionId: "sub-1-3",
                  titleKo: "학습 순서",
                  bodyKo: "이후 섹션에서 무엇을 읽으면 되는지 연결합니다.",
                },
              ],
            },
            {
              sectionId: "sec-2",
              titleKo: "런타임 구조",
              summaryKo: "런타임 진입점과 모듈 경계를 설명합니다.",
              sourcePaths: ["src/main.ts"],
              subsections: [
                {
                  sectionId: "sec-2",
                  subsectionId: "sub-2-1",
                  titleKo: "진입점",
                  bodyKo: "src/main.ts 경로를 중심으로 진입점을 설명합니다.",
                },
                {
                  sectionId: "sec-2",
                  subsectionId: "sub-2-2",
                  titleKo: "모듈 경계",
                  bodyKo: "모듈 경계를 따라 제어 흐름을 정리합니다.",
                },
                {
                  sectionId: "sec-2",
                  subsectionId: "sub-2-3",
                  titleKo: "오류 경로",
                  bodyKo: "오류가 어떻게 전파되는지 설명합니다.",
                },
              ],
            },
          ],
        },
      };

      const result = await writeMarkdownBundle(acceptedOutput as never, {
        outDir: root,
      });

      expect(result.files.map((file) => file.relativePath)).toEqual([
        "README.md",
        "01-sec-1.md",
        "02-sec-2.md",
      ]);

      const readme = readFileSync(join(result.outputDir, "README.md"), "utf8");
      expect(readme).toContain("# acme/widget");
      expect(readme).toContain("[프로젝트 개요](01-sec-1.md)");
      expect(readme).toContain("최근 릴리스 간격이 짧아졌습니다.");

      const section = readFileSync(join(result.outputDir, "02-sec-2.md"), "utf8");
      expect(section).toContain("# 2. 런타임 구조");
      expect(section).toContain("## 참고 소스");
      expect(section).toContain("`src/main.ts`");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
