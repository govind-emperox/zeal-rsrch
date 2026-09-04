import { Download, FileJson, FileText, Folder, Grid2X2, List, MoreHorizontal, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectTabs } from "@/components/project-tabs";
import { StatusPill } from "@/components/status-pill";
import { files } from "@/lib/mock-data";

const folders = ["reports", "manifests", "audits", "uploads", "tmp"];

export default function FilesPage() {
  const selected = files[0];

  return (
    <AppShell active="files">
      <div className="project-header">
        <div>
          <p className="eyebrow">Artifacts browser</p>
          <h1>Q3 AI procurement market map</h1>
          <p className="page-copy">Reports, source manifests, cleanup audits, uploads, and previews.</p>
        </div>
        <button className="secondary-button">
          <Download size={16} aria-hidden="true" />
          Export
        </button>
      </div>

      <ProjectTabs active="files" />

      <section className="summary-grid file-summary" aria-label="Artifact categories">
        <article className="metric-card">
          <span>Final reports</span>
          <strong>3</strong>
          <small>Retained</small>
        </article>
        <article className="metric-card">
          <span>Source manifests</span>
          <strong>5</strong>
          <small>Metadata only</small>
        </article>
        <article className="metric-card">
          <span>Cleanup audits</span>
          <strong>4</strong>
          <small>1 pending</small>
        </article>
        <article className="metric-card">
          <span>Uploaded papers</span>
          <strong>2</strong>
          <small>User retained</small>
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
              <p>Local object storage view for retained project outputs.</p>
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
                <StatusPill status={file.cleanup === "Passed" ? "complete" : "running"} label={file.cleanup} />
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
            <h3>Q3 AI procurement market map</h3>
            <p>
              This report groups procurement AI tools by buying motion, deployment model, evidence
              quality, and implementation risk.
            </p>
            <h4>Current findings</h4>
            <ul>
              <li>Security review claims require source-level verification.</li>
              <li>Procurement workflow depth varies materially by vendor segment.</li>
              <li>Temporary scrape output is excluded from retained source records.</li>
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
              <dt>Cleanup status</dt>
              <dd>{selected.cleanup}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </AppShell>
  );
}
