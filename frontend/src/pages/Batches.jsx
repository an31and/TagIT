import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Boxes, Loader2, Plus, ScanLine, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";
import api, { formatApiError } from "../lib/api";

const KIND_META = {
    individual: { label: "Individual IDs", hint: "One QR per person" },
    group: { label: "Group IDs", hint: "One QR per group / bus / tent" },
    family: { label: "Family IDs", hint: "One QR per family" },
};

const TAG_TYPES = ["general", "special", "medical", "luggage"];

/**
 * Bulk / event tags. An organisation — temple management, an NGO, an event or
 * government body — mints many QR IDs at once and hands them out. Every tag in
 * a batch is owned by the org, so finder alerts route straight to the org's
 * control room.
 */
export default function BatchesPage() {
    const navigate = useNavigate();
    const [batches, setBatches] = useState(null);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);

    async function load() {
        try {
            const { data } = await api.get("/batches");
            setBatches(data);
        } catch (e) {
            setError(formatApiError(e));
            setBatches([]);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="space-y-8" data-testid="batches-root">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">Bulk &amp; event tags</h1>
                    <p className="text-muted-foreground mt-1 max-w-xl">
                        Issue thousands of QR IDs for a function, yatra or camp. If someone is lost,
                        a finder scans their band and reaches your control room — no app, no exposed numbers.
                    </p>
                </div>
                <Button onClick={() => setCreating((v) => !v)} className="rounded-full gap-2" size="lg" data-testid="new-batch-btn">
                    <Plus className="h-4 w-4" /> New batch
                </Button>
            </div>

            {creating && (
                <CreateBatchForm
                    onCancel={() => setCreating(false)}
                    onCreated={(b) => {
                        setCreating(false);
                        toast.success(`Created ${b.count} tags for “${b.name}”.`);
                        navigate(`/batches/${b.id}`);
                    }}
                />
            )}

            {batches === null ? (
                <SkeletonList />
            ) : batches.length === 0 ? (
                <EmptyState onCreate={() => setCreating(true)} />
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batches.map((b) => (
                        <BatchCard key={b.id} batch={b} />
                    ))}
                </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function CreateBatchForm({ onCancel, onCreated }) {
    const [form, setForm] = useState({
        name: "",
        org_name: "",
        kind: "individual",
        tag_type: "general",
        count: 100,
        message: "",
    });
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.post("/batches", {
                ...form,
                count: Number(form.count),
            });
            onCreated(data);
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit} className="surface p-6 space-y-5 animate-rise" data-testid="create-batch-form">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="b-name">Event / campaign name</Label>
                    <Input id="b-name" required maxLength={120} placeholder="e.g. Function Days 2026" value={form.name} onChange={set("name")} data-testid="batch-name" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="b-org">Organisation (shown on stickers)</Label>
                    <Input id="b-org" maxLength={120} placeholder="e.g. Shri Temple Trust" value={form.org_name} onChange={set("org_name")} data-testid="batch-org" />
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Assign to</Label>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(KIND_META).map(([k, m]) => (
                            <button
                                type="button"
                                key={k}
                                onClick={() => setForm((f) => ({ ...f, kind: k }))}
                                className={`rounded-full px-3 py-1.5 text-sm border transition ${
                                    form.kind === k ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground"
                                }`}
                                data-testid={`kind-${k}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{KIND_META[form.kind].hint}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="b-type">Tag type</Label>
                    <select
                        id="b-type"
                        value={form.tag_type}
                        onChange={set("tag_type")}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        data-testid="batch-type"
                    >
                        {TAG_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="b-count">How many (max 5000)</Label>
                    <Input id="b-count" type="number" min={1} max={5000} required value={form.count} onChange={set("count")} data-testid="batch-count" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="b-msg">Message shown to a finder</Label>
                <Textarea id="b-msg" maxLength={500} rows={2} placeholder="Lost? Scan to reach our control room." value={form.message} onChange={set("message")} data-testid="batch-message" />
            </div>

            <p className="text-xs text-muted-foreground">
                Need more than 5000? Create the batch, then download the CSV manifest and send it to your printing vendor —
                each row has the QR&rsquo;s finder URL.
            </p>

            <div className="flex gap-3">
                <Button type="submit" disabled={busy} className="rounded-full gap-2" data-testid="batch-submit">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Generate tags
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
                    Cancel
                </Button>
            </div>
        </form>
    );
}

function BatchCard({ batch }) {
    const meta = KIND_META[batch.kind] || KIND_META.individual;
    return (
        <Link to={`/batches/${batch.id}`} className="surface p-5 flex flex-col gap-4 animate-rise hover:border-foreground/30 transition" data-testid={`batch-card-${batch.id}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent">
                    <Boxes className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <Badge variant={batch.status === "archived" ? "secondary" : "default"}>{batch.status}</Badge>
            </div>
            <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{meta.label}</div>
                <div className="font-display text-lg font-bold leading-tight mt-1 line-clamp-2">{batch.name}</div>
                {batch.org_name && <div className="text-xs text-muted-foreground mt-1">{batch.org_name}</div>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm mt-auto">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" /> {batch.count} tags</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><ScanLine className="h-4 w-4" /> {batch.scanned_count} scans</span>
            </div>
        </Link>
    );
}

function SkeletonList() {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["a", "b", "c"].map((k) => (
                <div key={k} className="surface p-5 space-y-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ onCreate }) {
    return (
        <div className="surface p-10 text-center animate-rise">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Boxes className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold">No batches yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Create a batch to generate QR IDs in bulk for an event, temple crowd, camp or NGO drive.
            </p>
            <Button onClick={onCreate} className="mt-5 rounded-full" data-testid="empty-new-batch-btn">
                <Plus className="h-4 w-4 mr-1" /> New batch
            </Button>
        </div>
    );
}
