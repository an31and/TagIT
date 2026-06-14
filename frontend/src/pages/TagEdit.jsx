import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, HeartPulse, Save, Trash2 } from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

import api, { formatApiError } from "../lib/api";
import { useI18n } from "../lib/i18n";

const TYPE_FIELDS = {
    vehicle: ["vehicle_make_model", "vehicle_plate"],
    pet: ["pet_name", "pet_breed", "note"],
    luggage: ["note"],
    keys: ["note"],
    medical: [],
    general: ["note"],
};

const EMPTY_TAG = {
    type: "vehicle",
    label: "",
    display_name: "",
    message: "",
    data: {},
    public_fields: {
        display_name: true,
        message: true,
        type: true,
        vehicle_make_model: true,
        vehicle_plate: false,
        pet_name: true,
        pet_breed: true,
        note: true,
    },
    status: "active",
};

export default function TagEditPage() {
    const { id } = useParams(); // "new" or actual id
    const isNew = !id || id === "new";
    const { t } = useI18n();
    const navigate = useNavigate();

    const [tag, setTag] = useState(isNew ? EMPTY_TAG : null);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isNew) return;
        (async () => {
            try {
                const { data } = await api.get(`/tags/${id}`);
                setTag(data);
                if (data.type === "medical") {
                    const { data: prof } = await api.get(`/tags/${id}/profile`);
                    setProfile(prof);
                }
            } catch (e) {
                setError(formatApiError(e));
            }
        })();
    }, [id, isNew]);

    const set = (path, value) => {
        setTag((prev) => {
            const next = { ...prev };
            if (path.startsWith("data.")) {
                next.data = { ...(prev.data || {}), [path.slice(5)]: value };
            } else if (path.startsWith("public_fields.")) {
                next.public_fields = { ...(prev.public_fields || {}), [path.slice(14)]: value };
            } else {
                next[path] = value;
            }
            return next;
        });
    };

    const onSave = async () => {
        setSaving(true);
        setError("");
        try {
            let savedTag;
            if (isNew) {
                const { data } = await api.post("/tags", {
                    type: tag.type,
                    label: tag.label,
                    display_name: tag.display_name,
                    message: tag.message,
                    data: tag.data,
                    public_fields: tag.public_fields,
                });
                savedTag = data;
            } else {
                const { data } = await api.patch(`/tags/${id}`, {
                    label: tag.label,
                    display_name: tag.display_name,
                    message: tag.message,
                    data: tag.data,
                    public_fields: tag.public_fields,
                    status: tag.status,
                });
                savedTag = data;
            }
            toast.success("Saved");
            if (savedTag.type === "medical") {
                navigate(`/tags/${savedTag.id}/medical`, { replace: true });
            } else {
                navigate(`/tags/${savedTag.id}/qr`, { replace: true });
            }
        } catch (e) {
            setError(formatApiError(e));
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        try {
            await api.delete(`/tags/${id}`);
            toast.success("Deleted");
            navigate("/dashboard", { replace: true });
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const typeFields = useMemo(() => TYPE_FIELDS[tag?.type || "general"] || [], [tag?.type]);

    if (!tag) {
        return <div className="text-muted-foreground animate-pulse-soft">{t("common.loading")}</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8" data-testid="tag-edit-root">
            <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1" data-testid="tag-edit-back">
                    <ArrowLeft className="h-4 w-4" /> {t("common.back")}
                </Button>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    {isNew ? t("tag_edit.new_title") : t("tag_edit.title")}
                </h1>
            </div>

            {/* Basic */}
            <Section title={t("tag_edit.section_basic")}>
                {isNew && (
                    <Field label="Type">
                        <Select value={tag.type} onValueChange={(v) => set("type", v)}>
                            <SelectTrigger data-testid="tag-type-trigger"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vehicle">{t("dashboard.vehicle")}</SelectItem>
                                <SelectItem value="pet">{t("dashboard.pet")}</SelectItem>
                                <SelectItem value="luggage">{t("dashboard.luggage")}</SelectItem>
                                <SelectItem value="keys">{t("dashboard.keys")}</SelectItem>
                                <SelectItem value="medical">{t("dashboard.medical")}</SelectItem>
                                <SelectItem value="general">{t("dashboard.general")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                )}
                <Field label={t("tag_edit.label")}>
                    <Input value={tag.label || ""} onChange={(e) => set("label", e.target.value)} placeholder="My Bike" data-testid="tag-label-input" />
                </Field>
                <Field label={t("tag_edit.display_name")}>
                    <Input value={tag.display_name || ""} onChange={(e) => set("display_name", e.target.value)} placeholder="Royal Enfield Classic 350" data-testid="tag-displayname-input" />
                </Field>
                <Field label={t("tag_edit.message")}>
                    <Textarea
                        value={tag.message || ""}
                        onChange={(e) => set("message", e.target.value)}
                        rows={3}
                        placeholder="If you see this bike parked badly or with lights on, tap below."
                        data-testid="tag-message-input"
                    />
                </Field>
                {!isNew && (
                    <Field label={t("tag_edit.section_status")}>
                        <Select value={tag.status} onValueChange={(v) => set("status", v)}>
                            <SelectTrigger data-testid="tag-status-trigger"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">{t("dashboard.status_active")}</SelectItem>
                                <SelectItem value="lost">{t("dashboard.status_lost")}</SelectItem>
                                <SelectItem value="found">{t("dashboard.status_found")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                )}
            </Section>

            {/* Type-specific data */}
            {typeFields.length > 0 && (
                <Section title={t("tag_edit.section_data")}>
                    {typeFields.map((f) => (
                        <Field key={f} label={t(`tag_edit.${f}`)}>
                            <Input
                                value={(tag.data && tag.data[f]) || ""}
                                onChange={(e) => set(`data.${f}`, e.target.value)}
                                data-testid={`tag-data-${f}`}
                            />
                        </Field>
                    ))}
                </Section>
            )}

            {/* Public fields */}
            <Section title={t("tag_edit.section_public")}>
                <p className="text-sm text-muted-foreground -mt-2 mb-2">
                    Toggle off any field you'd like to keep private. Owners' phone numbers are <em>never</em> exposed.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                    {Object.keys(tag.public_fields || {}).map((key) => (
                        <label key={key} className="flex items-center justify-between p-3 rounded-md border">
                            <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                            <Switch
                                checked={!!tag.public_fields[key]}
                                onCheckedChange={(v) => set(`public_fields.${key}`, v)}
                                data-testid={`public-${key}`}
                            />
                        </label>
                    ))}
                </div>
            </Section>

            {tag.type === "medical" && !isNew && (
                <div className="surface p-5 border-emergency/40">
                    <div className="flex items-start gap-3">
                        <HeartPulse className="h-5 w-5 text-destructive shrink-0" strokeWidth={2.5} />
                        <div className="flex-1">
                            <div className="font-display font-bold">Medical Emergency Profile</div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {profile?.emergency_mode ? "Emergency Mode is ON." : "Emergency Mode is OFF."}
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/tags/${id}/medical`)} data-testid="manage-medical-btn">
                            Manage
                        </Button>
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between gap-3 pt-4 border-t">
                {!isNew && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="text-destructive gap-1" data-testid="delete-tag-btn">
                                <Trash2 className="h-4 w-4" /> {t("tag_edit.delete_tag")}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t("tag_edit.delete_tag")}</AlertDialogTitle>
                                <AlertDialogDescription>{t("tag_edit.delete_warning")}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel data-testid="delete-cancel">{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete} data-testid="delete-confirm">{t("tag_edit.confirm_delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <Button onClick={onSave} disabled={saving} className="ml-auto rounded-full gap-2" data-testid="tag-save-btn">
                    <Save className="h-4 w-4" />
                    {saving ? t("common.loading") : isNew ? t("tag_edit.create") : t("tag_edit.save")}
                </Button>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section className="surface p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">{title}</h2>
            {children}
        </section>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
