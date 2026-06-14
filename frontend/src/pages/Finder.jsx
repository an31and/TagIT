import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    Bike,
    Briefcase,
    HeartPulse,
    KeyRound,
    MapPin,
    PawPrint,
    Phone,
    Send,
    ShieldAlert,
    Tag as TagIcon,
} from "lucide-react";

import api, { formatApiError } from "../lib/api";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useI18n } from "../lib/i18n";

const TYPE_META = {
    vehicle: { icon: Bike, label: "Vehicle" },
    pet: { icon: PawPrint, label: "Pet" },
    luggage: { icon: Briefcase, label: "Luggage" },
    keys: { icon: KeyRound, label: "Keys" },
    medical: { icon: HeartPulse, label: "Medical ID" },
    general: { icon: TagIcon, label: "Item" },
};

const QUICK_ACTIONS_BY_TYPE = {
    vehicle: [
        { key: "wrong_parking", labelKey: "finder.wrong_parking" },
        { key: "headlight_on", labelKey: "finder.headlight_on" },
        { key: "found", labelKey: "finder.found_share_location" },
    ],
    pet: [{ key: "found", labelKey: "finder.found_share_location" }],
    luggage: [{ key: "found", labelKey: "finder.found_share_location" }],
    keys: [{ key: "found", labelKey: "finder.found_share_location" }],
    general: [{ key: "found", labelKey: "finder.found_share_location" }],
    medical: [],
};

export default function FinderPage() {
    const { slug } = useParams();
    const { t, lang } = useI18n();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/public/tags/${slug}`);
                setData(data);
            } catch (e) {
                if (e?.response?.status === 404) setError("not_found");
                else setError(formatApiError(e));
            }
        })();
    }, [slug]);

    if (error === "not_found") {
        return <FinderNotFound />;
    }
    if (error) {
        return (
            <FinderLayout>
                <p className="text-destructive">{error}</p>
            </FinderLayout>
        );
    }
    if (!data) {
        return (
            <FinderLayout>
                <p className="text-muted-foreground animate-pulse-soft">{t("common.loading")}</p>
            </FinderLayout>
        );
    }

    if (data.emergency) {
        return <EmergencyView data={data} />;
    }

    if (data.is_unclaimed) {
        return (
            <FinderLayout>
                <div className="space-y-4 text-center" data-testid="finder-unclaimed">
                    <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
                    <h1 className="font-display text-2xl font-bold">{t("finder.unclaimed_title")}</h1>
                    <p className="text-muted-foreground">{t("finder.unclaimed_body")}</p>
                    <Link
                        to={`/claim/${slug}`}
                        className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-primary text-primary-foreground font-medium"
                        data-testid="finder-claim-btn"
                    >
                        {t("claim.claim_button")}
                    </Link>
                </div>
            </FinderLayout>
        );
    }

    return <FinderClaimedView data={data} />;
}

function FinderLayout({ children, accent = false }) {
    const { t } = useI18n();
    return (
        <div className={`min-h-screen flex flex-col ${accent ? "emergency-screen" : "bg-background"}`}>
            <header className="border-b">
                <div className="mx-auto max-w-md px-4 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-1.5 font-display font-black text-lg" data-testid="finder-brand">
                        <TagIcon className="h-4 w-4 text-accent" /> Tag<span className="text-accent">IT</span>
                    </Link>
                    <LanguageSwitcher compact />
                </div>
            </header>
            <main className="flex-1 mx-auto w-full max-w-md px-4 py-8">{children}</main>
            <footer className="border-t mt-6">
                <div className="mx-auto max-w-md px-4 py-4 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
                    <span>{t("finder.powered_by")}</span>
                    <span>🇮🇳 {t("common.made_in_india")}</span>
                </div>
            </footer>
        </div>
    );
}

function FinderNotFound() {
    const { t } = useI18n();
    return (
        <FinderLayout>
            <div className="text-center space-y-3" data-testid="finder-not-found">
                <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
                <h1 className="font-display text-2xl font-bold">{t("finder.tag_not_found")}</h1>
                <p className="text-muted-foreground">{t("finder.tag_not_found_help")}</p>
            </div>
        </FinderLayout>
    );
}

function FinderClaimedView({ data }) {
    const { t } = useI18n();
    const meta = TYPE_META[data.type] || TYPE_META.general;
    const Icon = meta.icon;
    const actions = QUICK_ACTIONS_BY_TYPE[data.type] || [];
    const [showMessageForm, setShowMessageForm] = useState(false);

    return (
        <FinderLayout>
            <div className="space-y-6 animate-rise" data-testid="finder-claimed">
                {/* Top card */}
                <div className="surface p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground">{meta.label}</div>
                            <h1 className="mt-1 font-display text-2xl font-bold leading-tight" data-testid="finder-display-name">
                                {data.display_name || "TagIT"}
                            </h1>
                        </div>
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10">
                            <Icon className="h-5 w-5 text-accent" strokeWidth={2.4} />
                        </div>
                    </div>
                    {data.status === "lost" && (
                        <div className="mt-4 p-3 rounded-md border border-destructive bg-destructive/10 text-sm font-semibold text-destructive">
                            {t("finder.reported_lost")}
                        </div>
                    )}
                    {data.message && (
                        <div className="mt-4 p-4 rounded-md border bg-muted/30">
                            <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("finder.owner_says")}</div>
                            <p className="mt-1 text-sm whitespace-pre-wrap" data-testid="finder-message">{data.message}</p>
                        </div>
                    )}
                </div>

                {/* Quick actions */}
                {actions.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t("finder.quick_actions")}</div>
                        {actions.map((a) => (
                            <QuickActionButton key={a.key} slug={data.slug} actionType={a.key} label={t(a.labelKey)} />
                        ))}
                    </div>
                )}

                {/* Free-form message */}
                {!showMessageForm ? (
                    <button
                        type="button"
                        className="w-full h-12 rounded-full border bg-card hover:bg-muted text-sm font-medium"
                        onClick={() => setShowMessageForm(true)}
                        data-testid="finder-open-message"
                    >
                        {t("finder.send_message")}
                    </button>
                ) : (
                    <FinderMessageForm slug={data.slug} />
                )}
            </div>
        </FinderLayout>
    );
}

function QuickActionButton({ slug, actionType, label }) {
    const { t } = useI18n();
    const [state, setState] = useState("idle"); // idle | sending | sent | error
    const [errMsg, setErrMsg] = useState("");

    const send = async () => {
        setState("sending");
        const location = await tryGetLocation();
        try {
            await api.post(`/public/tags/${slug}/messages`, {
                action_type: actionType,
                body: label,
                location,
                bot_check: "",
            });
            setState("sent");
        } catch (e) {
            setErrMsg(formatApiError(e));
            setState("error");
        }
    };

    const isAction = state === "idle";
    return (
        <button
            type="button"
            onClick={send}
            disabled={state === "sending" || state === "sent"}
            className={[
                "w-full h-14 px-5 rounded-2xl text-left transition-colors flex items-center justify-between",
                state === "sent" ? "bg-accent/10 text-accent border border-accent/40" : "bg-card border hover:bg-muted",
                state === "error" ? "border-destructive" : "",
            ].join(" ")}
            data-testid={`finder-action-${actionType}`}
        >
            <span className="font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">
                {state === "idle" && "→"}
                {state === "sending" && t("common.loading")}
                {state === "sent" && "✓ " + t("finder.sent_thanks")}
                {state === "error" && errMsg}
            </span>
        </button>
    );
}

function FinderMessageForm({ slug }) {
    const { t } = useI18n();
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [body, setBody] = useState("");
    const [share, setShare] = useState(true);
    const [botCheck, setBotCheck] = useState("");
    const [state, setState] = useState("idle");
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setState("sending");
        setErr("");
        const location = share ? await tryGetLocation() : null;
        try {
            await api.post(`/public/tags/${slug}/messages`, {
                action_type: "message",
                finder_name: name,
                finder_contact: contact,
                body,
                location,
                bot_check: botCheck,
            });
            setState("sent");
        } catch (e) {
            setErr(formatApiError(e));
            setState("error");
        }
    };

    if (state === "sent") {
        return (
            <div className="surface p-5 text-center text-accent" data-testid="finder-message-sent">
                ✓ {t("finder.sent_thanks")}
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="surface p-5 space-y-3" data-testid="finder-message-form">
            <input
                type="text"
                placeholder={t("finder.your_name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3 rounded-md border bg-background"
                data-testid="finder-name-input"
            />
            <input
                type="text"
                placeholder={t("finder.your_contact")}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full h-11 px-3 rounded-md border bg-background"
                data-testid="finder-contact-input"
            />
            <textarea
                rows={4}
                placeholder={t("finder.message_placeholder")}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background"
                data-testid="finder-body-input"
            />
            {/* Honeypot — hidden from humans */}
            <input
                type="text"
                value={botCheck}
                onChange={(e) => setBotCheck(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="absolute left-[-9999px] top-[-9999px]"
                aria-hidden="true"
            />
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} data-testid="finder-share-loc" />
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {t("finder.include_my_location")}
            </label>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button
                type="submit"
                disabled={state === "sending"}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2"
                data-testid="finder-send-btn"
            >
                <Send className="h-4 w-4" /> {state === "sending" ? t("common.loading") : t("finder.send")}
            </button>
        </form>
    );
}

function EmergencyView({ data }) {
    const { t } = useI18n();
    const em = data.emergency;
    const phone = em.emergency_contact_phone?.replace(/[^+\d]/g, "");
    return (
        <FinderLayout accent>
            <div className="space-y-5 animate-rise" data-testid="emergency-root">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-black tracking-widest uppercase">
                        <HeartPulse className="h-3.5 w-3.5" /> {t("emergency.heading")}
                    </div>
                    <h1 className="mt-3 font-display text-3xl font-black tracking-tight" data-testid="emergency-name">
                        {data.display_name}
                    </h1>
                </div>

                <div className="surface p-5 space-y-3 border-emergency/40">
                    <EmField label={t("emergency.blood_group")} value={em.blood_group} highlight />
                    <EmField label={t("emergency.allergies")} value={em.allergies} />
                    <EmField label={t("emergency.chronic_conditions")} value={em.chronic_conditions} />
                    {em.additional_notes && <EmField label={t("emergency.notes")} value={em.additional_notes} />}
                    {em.nearest_police_station && (
                        <EmField label={t("emergency.nearest_ps")} value={em.nearest_police_station} />
                    )}
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                        {t("common.verify_before_acting")}
                        {em.last_updated && <> · {t("common.last_updated")}: {new Date(em.last_updated).toLocaleDateString()}</>}
                    </p>
                </div>

                {phone && (
                    <a
                        href={`tel:${phone}`}
                        className="emergency-bg flex items-center justify-center gap-3 h-16 rounded-2xl text-lg font-display font-black tracking-wide uppercase shadow-lg sticky bottom-4"
                        data-testid="emergency-call-btn"
                    >
                        <Phone className="h-5 w-5" strokeWidth={2.6} />
                        {t("emergency.call_contact")}
                    </a>
                )}
                {em.emergency_contact_name && (
                    <p className="text-center text-sm text-muted-foreground -mt-2">
                        {em.emergency_contact_name}
                    </p>
                )}
                <p className="text-xs text-muted-foreground text-center">{t("emergency.disclaimer")}</p>
            </div>
        </FinderLayout>
    );
}

function EmField({ label, value, highlight }) {
    if (!value) return null;
    return (
        <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className={highlight ? "font-display text-3xl font-black emergency-text" : "font-medium"}>{value}</div>
        </div>
    );
}

async function tryGetLocation() {
    if (!("geolocation" in navigator)) return null;
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000, enableHighAccuracy: false },
        );
    });
}
