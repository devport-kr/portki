/**
 * src/commands/resume.ts — `portki resume owner/repo`
 *
 * Regenerates handoff.md from the last valid stage.
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadSession, sessionPathForRepo } from "../chunked/session";
import { planContext } from "../chunked/plan-sections";
import { ingestRunArtifactSchema } from "../ingestion/types";
import { PlanContextSchema } from "../contracts/chunked-generation";
import { renderHandoff } from "./handoff";
import { repoSlug, workspacePath } from "./wiki";

export async function resumeCommand(argv: string[]): Promise<void> {
  const ownerRepo = argv[0];
  if (!ownerRepo || !ownerRepo.includes("/")) {
    throw new Error("Usage: portki resume owner/repo");
  }

  const repo = ownerRepo.toLowerCase();
  const slug = repoSlug(repo);

  process.stderr.write(`[portki] resume: ${repo}\n`);

  // Check artifact
  const artifactPath = workspacePath(repo, "artifact.json");
  if (!existsSync(path.resolve(artifactPath))) {
    throw new Error(
      `No artifact found at ${artifactPath}. Run \`portki ${repo}\` first.`,
    );
  }

  const artifactRaw = await readFile(path.resolve(artifactPath), "utf8");
  const artifact = ingestRunArtifactSchema.parse(JSON.parse(artifactRaw));

  // Check plan context — regenerate if missing
  const planContextPath = workspacePath(repo, "plan-context.json");
  let ctx;
  if (existsSync(path.resolve(planContextPath))) {
    const raw = await readFile(path.resolve(planContextPath), "utf8");
    ctx = PlanContextSchema.parse(JSON.parse(raw));
    process.stderr.write(`  plan-context: loaded from cache\n`);
  } else {
    process.stderr.write(`  plan-context: regenerating...\n`);
    ctx = await planContext(artifact);
    await writeFile(
      path.resolve(planContextPath),
      `${JSON.stringify(ctx, null, 2)}\n`,
      "utf8",
    );
  }

  // Check session for persisted sections
  const sessionPath = sessionPathForRepo(repo);
  const session = await loadSession(sessionPath);
  const persistedSections: string[] = [];

  const stepOverrides: Record<string, "DONE" | "PENDING"> = {
    ingest: "DONE",
    "plan-sections": "DONE",
  };

  if (session) {
    for (const [secId, sec] of Object.entries(session.sections)) {
      if (sec.status === "persisted") {
        persistedSections.push(secId);
      }
    }

    // Check if plan was validated
    const sectionPlanPath = workspacePath(repo, "section-plan.json");
    if (existsSync(path.resolve(sectionPlanPath))) {
      stepOverrides["write-plan"] = "DONE";
      stepOverrides["validate-plan"] = "DONE";
    }

    if (persistedSections.length > 0) {
      const total = Object.keys(session.sections).length;
      if (persistedSections.length >= total) {
        stepOverrides["persist-sections"] = "DONE";
      }
    }
  }

  // Regenerate handoff
  const handoffPath = workspacePath(repo, "handoff.md");
  const handoff = renderHandoff({
    ownerRepo: repo,
    slug,
    artifactPath,
    planContextPath,
    artifact,
    planContext: ctx,
    stepOverrides,
    persistedSections,
  });

  await writeFile(path.resolve(handoffPath), handoff, "utf8");

  if (persistedSections.length > 0) {
    process.stderr.write(
      `  ${persistedSections.length} section(s) already persisted: ${persistedSections.join(", ")}\n`,
    );
  }

  process.stderr.write(
    `\n  Handoff regenerated:\n  ${handoffPath}\n\n`,
  );

  process.stdout.write(`${path.resolve(handoffPath)}\n`);
}
