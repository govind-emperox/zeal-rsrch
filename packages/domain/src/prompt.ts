export type ResearchPromptInput = {
  projectTitle: string;
  taskTitle: string;
  request: string;
  skillName?: string;
};

const SKILL_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;

function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildResearchPrompt({
  projectTitle,
  taskTitle,
  request,
  skillName = "research-journalist",
}: ResearchPromptInput): string {
  if (!SKILL_NAME.test(skillName)) {
    throw new Error(`Invalid skill name: ${skillName}`);
  }

  const normalizedProjectTitle = normalizeLabel(projectTitle);
  const normalizedTaskTitle = normalizeLabel(taskTitle);
  const normalizedRequest = request.trim();

  if (!normalizedProjectTitle || !normalizedTaskTitle || !normalizedRequest) {
    throw new Error("Project title, task title, and research request are required");
  }

  return [
    `$${skillName}`,
    "",
    `Project: ${normalizedProjectTitle}`,
    `Task: ${normalizedTaskTitle}`,
    "",
    "Research request:",
    normalizedRequest,
    "",
    "Retention requirements:",
    "- Retain the final report, source manifest, citation metadata, cleanup audit, and user-provided files.",
    "- Delete temporary scrape output, copied source bodies, extracted page text, and temporary notes when the run ends.",
    "- Do not put raw source bodies or secrets in events, logs, or the final cleanup audit.",
    "- Report any cleanup item that could not be deleted and explain why.",
  ].join("\n");
}
