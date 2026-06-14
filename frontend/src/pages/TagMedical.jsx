import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, HeartPulse, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";

import api, { formatApiError } from "../lib/api";
import { useI18n } from "../lib/i18n";

const EMPTY_PROFILE = {
    emergency_mode: false,
    blood_group: "",
    allergies: "",
    chronic_conditions: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    nearest_police_station: "",
    additional_notes: "",
    consent_given: false,
};

export default function TagMedicalPage() {
    const { id } = useParams();
    const { t } = useI18n();
    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/tags/${id}/profile`);
                setProfile({ ...EMPTY_PROFILE, ...data });
            } catch (e) {
                setError(formatApiError(e));
            }
        })();
    }, [id]);

    const set = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

    const onSave = async () => {
        if (profile.emergency_mode && !profile.consent_given) {
            setError("Please confirm consent before enabling Emergency Mode.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const { data } = await api.put(`/tags/${id}/profile`, profile);
            setProfile({ ...EMPTY_PROFILE, ...data });
            toast.success(t("medical.saved"));
        } catch (e) {
            setError(formatApiError(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6" data-testid="medical-root">
            <Link to={`/tags/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-testid="medical-back">
                <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </Link>

            <div className="surface p-6 border-emergency/40 space-y-1">
                <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-destructive" strokeWidth={2.5} />
                    <h1 className="font-display text-2xl font-bold tracking-tight">{t("medical.title")}</h1>
                </div>
                <p className="text-sm text-muted-foreground">{t("medical.disclaimer")}</p>
            </div>

            <div className="surface p-6 space-y-5">
                <label className="flex items-start justify-between gap-4 cursor-pointer">
                    <div>
                        <div className="font-display font-bold">{t("medical.emergency_mode")}</div>
                        <p className="text-sm text-muted-foreground">
                            When ON, fields below show up instantly to anyone who scans the QR.
                        </p>
                    </div>
                    <Switch
                        checked={profile.emergency_mode}
                        onCheckedChange={(v) => set("emergency_mode", v)}
                        data-testid="emergency-mode-switch"
                    />
                </label>

                <Grid>
                    <Field label={t("medical.blood_group")}>
                        <Input value={profile.blood_group} onChange={(e) => set("blood_group", e.target.value)} placeholder="O+" data-testid="med-blood-group" />
                    </Field>
                    <Field label={t("medical.emergency_contact_name")}>
                        <Input value={profile.emergency_contact_name} onChange={(e) => set("emergency_contact_name", e.target.value)} data-testid="med-contact-name" />
                    </Field>
                    <Field label={t("medical.emergency_contact_phone")}>
                        <Input value={profile.emergency_contact_phone} onChange={(e) => set("emergency_contact_phone", e.target.value)} placeholder="+91…" data-testid="med-contact-phone" />
                    </Field>
                    <Field label={t("medical.nearest_police_station")}>
                        <Input value={profile.nearest_police_station} onChange={(e) => set("nearest_police_station", e.target.value)} data-testid="med-police" />
                    </Field>
                </Grid>

                <Field label={t("medical.allergies")}>
                    <Textarea rows={2} value={profile.allergies} onChange={(e) => set("allergies", e.target.value)} data-testid="med-allergies" />
                </Field>
                <Field label={t("medical.chronic_conditions")}>
                    <Textarea rows={2} value={profile.chronic_conditions} onChange={(e) => set("chronic_conditions", e.target.value)} data-testid="med-chronic" />
                </Field>
                <Field label={t("medical.additional_notes")}>
                    <Textarea rows={3} value={profile.additional_notes} onChange={(e) => set("additional_notes", e.target.value)} data-testid="med-notes" />
                </Field>

                <label className="flex items-start gap-3 p-4 rounded-md border border-emergency/30 bg-emergency/5">
                    <Checkbox
                        checked={profile.consent_given}
                        onCheckedChange={(v) => set("consent_given", !!v)}
                        data-testid="med-consent"
                    />
                    <div className="text-sm">{t("medical.consent_label")}</div>
                </label>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-end">
                    <Button onClick={onSave} disabled={saving} className="rounded-full gap-2" data-testid="med-save-btn">
                        <Save className="h-4 w-4" />
                        {saving ? t("common.loading") : t("medical.title")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Grid({ children }) {
    return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
