import { Download, FileJson, FileText, Folder, Grid2X2, List, MoreHorizontal, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectTabs } from "@/components/project-tabs";
import { StatusPill } from "@/components/status-pill";
import { files, folders, primaryProject } from "@/lib/mock-data";

export default function FilesPage() {
  const selected = files[0];

  return (
    <AppShell active="files">
      <div className="project-header">
        <div>
          <p className="eyebrow">Artifacts browser</p>
          <h1>{primaryProject.title}</h1>
          <p className="page-copy">
            Existing Cur8r research and editorial reference files for {primaryProject.episode}.
          </p>
        </div>
        <button className="secondary-button">
          <Download size={16} aria-hidden="true" />
          Export
        </button>
      </div>

      <ProjectTabs active="files" />

      <section className="summary-grid file-summary" aria-label="Artifact categories">
        <article className="metric-card">
          <span>Research files</span>
          <strong>2</strong>
          <small>Markdown and CSV</small>
        </article>
        <article className="metric-card">
          <span>Shortlist files</span>
          <strong>1</strong>
          <small>Work in progress</small>
        </article>
        <article className="metric-card">
          <span>Research candidates</span>
          <strong>34</strong>
          <small>Adult science fiction</small>
        </article>
        <article className="metric-card">
          <span>Shortlisted titles</span>
          <strong>6</strong>
          <small>Editorial review pending</small>
        </article>
      </section>

      <section className="files-grid" aria-label="Project files browser">
        <aside className="panel folder-tree" aria-labelledby="folder-tree">
          <h2 id="folder-tree">Folders</h2>
          <div className="folder-list">
            {folders.map((folder, index) => (
              <button className={index === 0 ? "folder-row active" : "folder-row"} key={folder}>
                <Folder size={15} aria-hidden="true" />
                {folder}
              </button>
            ))}
          </div>
        </aside>

        <section className="panel file-list-panel" aria-labelledby="file-list">
          <div className="panel-toolbar">
            <div>
              <h2 id="file-list">Project artifacts</h2>
              <p>Local reference artifacts from the current Cur8r episode workspace.</p>
            </div>
            <div className="toolbar-cluster">
              <label className="inline-search">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Search files</span>
                <input placeholder="Search files" />
              </label>
              <button className="icon-button active" aria-label="List view">
                <List size={16} />
              </button>
              <button className="icon-button" aria-label="Grid view">
                <Grid2X2 size={16} />
              </button>
            </div>
          </div>

          <div className="file-table">
            {files.map((file, index) => (
              <article className={index === 0 ? "file-row active" : "file-row"} key={file.name}>
                <div className="file-icon">
                  {file.name.endsWith(".json") ? <FileJson size={17} /> : <FileText size={17} />}
                </div>
                <div>
                  <strong>{file.name}</strong>
                  <small>{file.type}</small>
                </div>
                <span>{file.size}</span>
                <span>{file.created}</span>
                <StatusPill
                  status={file.state === "Retained" ? "complete" : "review"}
                  label={file.state}
                />
                <button className="icon-button" aria-label={`More actions for ${file.name}`}>
                  <MoreHorizontal size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel preview-panel" aria-labelledby="preview">
          <div className="panel-title-row">
            <h2 id="preview">Preview</h2>
            <StatusPill status="complete" label="Retained" />
          </div>
          <div className="markdown-preview">
            <h3>Science Fiction Books — September 2026</h3>
            <p>
              Adult science fiction released September 1–30, 2026: novels, novellas,
              single-author collections, and anthologies.
            </p>
            <h4>Current reference set</h4>
            <ul>
              <li>34 candidate releases are documented.</li>
              <li>Six titles are in the working shortlist.</li>
              <li>YA, middle grade, graphic novels, and nonfiction are excluded.</li>
            </ul>
          </div>

          <dl className="metadata-list">
            <div>
              <dt>File</dt>
              <dd>{selected.name}</dd>
            </div>
            <div>
              <dt>Source task</dt>
              <dd>{selected.task}</dd>
            </div>
            <div>
              <dt>Retention class</dt>
              <dd>{selected.retention}</dd>
            </div>
            <div>
              <dt>File status</dt>
              <dd>{selected.state}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </AppShell>
  );
}
