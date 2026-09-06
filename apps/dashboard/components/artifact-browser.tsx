"use client";

import { Download, FileJson, FileText, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Artifact } from "@zeal-rsrch/contracts";
import { StatusPill } from "./status-pill";

export function ArtifactBrowser({ artifacts }: { artifacts: Artifact[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [selected, setSelected] = useState<Artifact | null>(artifacts[0] ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filtered = artifacts.filter((artifact) => (kind === "all" || artifact.kind === kind) && artifact.name.toLowerCase().includes(query.toLowerCase()));

  async function select(artifact: Artifact) {
    setSelected(artifact); setPreview(null); setError(null);
    const response = await fetch(`/api/artifacts/${artifact.id}/preview`);
    if (response.ok) setPreview((await response.json()).data.content);
    else setError((await response.json().catch(() => null))?.error?.message ?? "Preview unavailable");
  }

  async function remove() {
    if (!selected || !window.confirm(`Delete ${selected.name}?`)) return;
    const response = await fetch(`/api/artifacts/${selected.id}`, { method: "DELETE" });
    if (!response.ok) setError((await response.json().catch(() => null))?.error?.message ?? "Unable to delete artifact");
    else window.location.reload();
  }

  return <section className="files-grid" aria-label="Project files browser">
    <section className="panel file-list-panel" aria-labelledby="file-list">
      <div className="panel-toolbar"><div><h2 id="file-list">Project artifacts</h2><p>Retained reports, manifests, audits, and uploads.</p></div><div className="toolbar-cluster"><label className="inline-search"><Search size={15} aria-hidden="true" /><span className="sr-only">Search artifacts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artifacts" /></label><select value={kind} onChange={(event) => setKind(event.target.value)} aria-label="Filter by artifact type"><option value="all">All types</option><option value="report">Reports</option><option value="manifest">Manifests</option><option value="audit">Audits</option><option value="upload">Uploads</option></select></div></div>
      <div className="file-table">{filtered.map((artifact) => <button type="button" className={selected?.id === artifact.id ? "file-row active" : "file-row"} onClick={() => select(artifact)} key={artifact.id}><div className="file-icon">{artifact.contentType.includes("json") ? <FileJson size={17} /> : <FileText size={17} />}</div><div><strong>{artifact.name}</strong><small>{artifact.kind} · {artifact.contentType}</small></div><span>{Math.ceil(artifact.sizeBytes / 1024)} KB</span><span>{new Date(artifact.createdAt).toLocaleDateString()}</span><StatusPill status={artifact.retentionClass === "temporary_scrape" ? "review" : "complete"} label={artifact.retentionClass.replaceAll("_", " ")} /></button>)}</div>
    </section>
    <aside className="panel preview-panel" aria-labelledby="preview"><div className="panel-title-row"><h2 id="preview">Preview</h2>{selected ? <a className="icon-button" href={`/api/artifacts/${selected.id}?download=true`} aria-label={`Download ${selected.name}`}><Download size={16} /></a> : null}</div>{error ? <p className="callout warning" role="alert">{error}</p> : null}{selected ? <><pre className="artifact-preview">{preview ?? "Select an artifact to load a text preview."}</pre><dl className="metadata-list"><div><dt>File</dt><dd>{selected.name}</dd></div><div><dt>Retention class</dt><dd>{selected.retentionClass}</dd></div><div><dt>Content type</dt><dd>{selected.contentType}</dd></div><div><dt>Hash</dt><dd>{selected.contentHash}</dd></div></dl><div className="artifact-actions"><button className="secondary-button" onClick={() => { const name = window.prompt("Artifact name", selected.name)?.trim(); if (name) fetch(`/api/artifacts/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).then(() => window.location.reload()); }}>Rename</button><button className="secondary-button" onClick={remove}><Trash2 size={15} />Delete</button></div></> : <p>No artifacts match this filter.</p>}</aside>
  </section>;
}
