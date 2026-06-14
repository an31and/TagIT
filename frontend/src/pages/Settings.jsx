import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";

import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";

export default function SettingsPage() {
    const { t, lang, setLang, langs } = useI18n();
    const { user, refresh, logout } = useAuth();
    const [me, setMe] = useState(user || null);
    const [error, setError] = useState("");

    useEffect(() => {
        setMe(user);
    }, [user]);

    if (!me) {
        return <div className="text-muted-foreground animate-pulse-soft">{t("common.loading")}</div>;
    }

    const save = async (patch) => {
        try {
            const { data } = await api.patch("/auth/me", patch);
            setMe(data);
            await refresh();
            toast.success(t("settings.saved"));
        } catch (e) {
            setError(formatApiError(e));
        }
    };

    const exportData = async () => {
        try {
            const { data } = await api.get("/auth/export");
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "tagit-export.json";
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            setError(formatApiError(e));
        }
    };

    const deleteAccount = async () => {
        try {
            await api.delete("/auth/me");
            await logout();
            window.location.href = "/";
        } catch (e) {
            setError(formatApiError(e));
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6" data-testid="settings-root">
            <h1 className="font-display text-3xl font-black tracking-tight">{t("settings.title")}</h1>

            <section className="surface p-6 space-y-4">
                <h2 className="font-display text-lg font-bold">{t("settings.account")}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>{t("auth.email")}</Label>
                        <Input value={me.email} disabled />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t("auth.display_name")}</Label>
                        <Input
                            value={me.display_name || ""}
                            onChange={(e) => setMe({ ...me, display_name: e.target.value })}
                            onBlur={() => save({ display_name: me.display_name })}
                            data-testid="settings-displayname"
                        />
                    </div>
                </div>
            </section>

            <section className="surface p-6 space-y-3">
                <h2 className="font-display text-lg font-bold">{t("settings.notifications")}</h2>
                <Row label={t("settings.notify_on_message")}>
                    <Switch
                        checked={!!me.notify_on_message}
                        onCheckedChange={(v) => save({ notify_on_message: v })}
                        data-testid="notify-message-switch"
                    />
                </Row>
                <Row label={t("settings.notify_on_scan")}>
                    <Switch
                        checked={!!me.notify_on_scan}
                        onCheckedChange={(v) => save({ notify_on_scan: v })}
                        data-testid="notify-scan-switch"
                    />
                </Row>
            </section>

            <section className="surface p-6 space-y-3">
                <h2 className="font-display text-lg font-bold">{t("settings.language")}</h2>
                <Select value={lang} onValueChange={(v) => { setLang(v); save({ locale: v }); }}>
                    <SelectTrigger data-testid="settings-lang-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {langs.map((l) => (
                            <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </section>

            <section className="surface p-6 space-y-3">
                <h2 className="font-display text-lg font-bold">Data & privacy</h2>
                <Button variant="outline" onClick={exportData} className="gap-2" data-testid="export-data-btn">
                    <Download className="h-4 w-4" /> {t("settings.export")}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="text-destructive gap-2" data-testid="delete-account-btn">
                            <Trash2 className="h-4 w-4" /> {t("settings.delete_account")}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("settings.delete_account")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("settings.delete_warning")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel data-testid="delete-account-cancel">{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={deleteAccount} data-testid="delete-account-confirm">{t("settings.confirm_delete")}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </section>

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function Row({ label, children }) {
    return (
        <div className="flex items-center justify-between gap-4 p-3 rounded-md border">
            <span className="text-sm">{label}</span>
            {children}
        </div>
    );
}
