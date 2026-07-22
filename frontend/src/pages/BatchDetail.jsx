import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, ScanLine, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import api, { API_BASE, formatApiError } from "../lib/api";

const PAGE = 100;

/** Credentialed download — asset endpoints need the auth cookie + a blob to
 *  force a real "Save as" rather than a same-tab navigation. */
async function downloadFile(url, filename) {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
}

export default function BatchDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [tags, setTags] = useState([]);
    const [skip, setSkip] = useState(0);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/batches/${id}`);
                setBatch(data);
            } catch (e) {
                setError(formatApiError(e));
            }
        })();
    }, [id]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/batches/${id}/tags`, { params: { skip, limit: PAGE } });
                setTags(data);
            } catch (e) {
                setError(formatApiError(e));
            }
        })();
    }, [id, skip]);

    async function download(kind) {
        setDownloading(kind);
        try {
            if (kind === "csv") {
                await downloadFile(`${API_BASE}/batches/${id}/manifest.csv`, `${batch.name}-manifest.csv`);
            } else {
                const start = skip + 1;
                await downloadFile(`${API_BASE}/batches/${id}/qrs.pdf?start=${start}&count=${PAGE}`, `${batch.name}-qrs-${start}.pdf`);
            }
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setDownloading("");
        }
    }

    async function remove() {
        if (!window.confirm(`Delete “${batch.name}” and all ${batch.count} tags? This cannot be undone.`)) return;
        try {
            await api.delete(`/batches/${id}`);
            toast.success("Batch deleted.");
            navigate("/batches");
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }

    if (error && !batch) return <p className="text-sm text-destructive">{error}</p>;
    if (!batch) return <BatchSkeleton />;

    const pageEnd = Math.min(skip + tags.length, batch.count);

    return (
        <div className="space-y-8" data-testid="batch-detail-root">
            <Link to="/batches" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> All batches
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="font-display text-3xl font-black tracking-tight">{batch.name}</h1>
                        <Badge variant={batch.status === "archived" ? "secondary" : "default"}>{batch.status}</Badge>
                    </div>
                    {batch.org_name && <p className="text-muted-foreground mt-1">{batch.org_name}</p>}
                    {batch.message && <p className="text-sm text-muted-foreground mt-2 max-w-xl">“{batch.message}”</p>}
                </div>
                <Button variant="outline" onClick={remove} className="rounded-full gap-2 text-destructive" data-testid="delete-batch-btn">
                    <Trash2 className="h-4 w-4" /> Delete
                </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
                <Stat label="Tags" value={batch.count} icon={<Users className="h-5 w-5" />} />
                <Stat label="Scans" value={batch.scanned_count} icon={<ScanLine className="h-5 w-5" />} />
                <Stat label="Assign to" value={batch.kind} icon={<Users className="h-5 w-5" />} />
            </div>

            <div className="surface p-6 space-y-3">
                <h2 className="font-display text-lg font-bold">Print &amp; hand out</h2>
                <p className="text-sm text-muted-foreground">
                    Download printable QR sticker sheets, or export the full CSV manifest (one row per QR, with its finder URL)
                    and send it to a printing vendor for large runs.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button onClick={() => download("pdf")} disabled={downloading === "pdf"} className="rounded-full gap-2" data-testid="download-pdf-btn">
                        {downloading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        QR sheets (this page)
                    </Button>
                    <Button onClick={() => download("csv")} disabled={downloading === "csv"} variant="outline" className="rounded-full gap-2" data-testid="download-csv-btn">
                        {downloading === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                        CSV manifest (all {batch.count})
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">
                        Tags <span className="text-muted-foreground font-normal">{skip + 1}–{pageEnd} of {batch.count}</span>
                    </h2>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="rounded-full" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - PAGE))}>
                            Prev
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full" disabled={pageEnd >= batch.count} onClick={() => setSkip(skip + PAGE)}>
                            Next
                        </Button>
                    </div>
                </div>
                <div className="surface divide-y">
                    {tags.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-3 p-3" data-testid={`batch-tag-${t.seq}`}>
                            <div className="min-w-0">
                                <div className="font-medium truncate">{t.display_name}</div>
                                <div className="text-xs text-muted-foreground font-mono truncate">/tag/{t.slug}</div>
                            </div>
                            <a href={`${window.location.origin}/api/finder/${t.slug}`} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="ghost" className="rounded-full">Preview</Button>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, icon }) {
    return (
        <div className="surface p-5">
            <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
                <div className="text-muted-foreground">{icon}</div>
            </div>
            <div className="mt-3 font-display text-3xl font-black tracking-tight capitalize">{value}</div>
        </div>
    );
}

function BatchSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid sm:grid-cols-3 gap-4">
                {["a", "b", "c"].map((k) => (
                    <Skeleton key={k} className="h-24 w-full" />
                ))}
            </div>
        </div>
    );
}
