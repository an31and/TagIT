/**
 * UseCaseShowcase — animated "InfoTag in action" scenes for the landing page.
 *
 * Pure CSS keyframes (see index.css), zero new dependencies, and every
 * animation is disabled under prefers-reduced-motion.
 */
import { useState } from "react";
import {
    Bike,
    HeartPulse,
    MapPin,
    MessageCircle,
    Phone,
    PhoneCall,
    QrCode,
    ShieldCheck,
    Smartphone,
} from "lucide-react";

import { useI18n } from "../lib/i18n";

const SCENES = [
    { key: "parking", icon: Bike, accent: "text-accent" },
    { key: "callback", icon: PhoneCall, accent: "text-emerald-500" },
    { key: "found", icon: MapPin, accent: "text-sky-500" },
    { key: "medical", icon: HeartPulse, accent: "text-destructive" },
];

export function UseCaseShowcase() {
    const { t } = useI18n();
    const [active, setActive] = useState("parking");

    return (
        <section className="border-y bg-muted/30" id="use-cases">
            <div className="mx-auto max-w-6xl px-4 sm:px-8 py-16">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    {t("landing.use_cases_title")}
                </h2>
                <p className="mt-2 text-muted-foreground max-w-2xl">{t("landing.use_cases_subtitle")}</p>

                {/* Scene picker */}
                <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label={t("landing.use_cases_title")}>
                    {SCENES.map(({ key, icon: Icon, accent }) => (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={active === key}
                            onClick={() => setActive(key)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
                                active === key
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card hover:border-accent/60"
                            }`}
                            data-testid={`usecase-tab-${key}`}
                        >
                            <Icon className={`h-4 w-4 ${active === key ? "" : accent}`} />
                            {t(`landing.usecase_${key}`)}
                        </button>
                    ))}
                </div>

                {/* Animated scene */}
                <div className="mt-6 grid lg:grid-cols-2 gap-6 items-stretch">
                    <div className="surface p-6 sm:p-8 flex items-center justify-center min-h-[260px] overflow-hidden">
                        {active === "parking" && <ParkingScene key="parking" />}
                        {active === "callback" && <CallbackScene key="callback" />}
                        {active === "found" && <FoundScene key="found" />}
                        {active === "medical" && <MedicalScene key="medical" />}
                    </div>
                    <div className="surface p-6 sm:p-8 flex flex-col justify-center animate-rise">
                        <div className="font-display font-bold text-xl">{t(`landing.usecase_${active}_title`)}</div>
                        <p className="mt-3 text-muted-foreground leading-relaxed">
                            {t(`landing.usecase_${active}_desc`)}
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            {t(`landing.usecase_${active}_privacy`)}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* --------------------------------------------------------------------- */
/* Scenes — small SVG/emoji vignettes brought to life with CSS keyframes  */
/* --------------------------------------------------------------------- */

function SceneQr({ className = "" }) {
    return (
        <div className={`relative w-20 h-20 rounded-xl border-2 border-foreground/70 bg-card flex items-center justify-center ${className}`}>
            <QrCode className="h-12 w-12" strokeWidth={1.6} />
            {/* scan line sweeping over the QR */}
            <span className="absolute left-1 right-1 h-0.5 bg-accent rounded-full animate-scan-sweep" />
        </div>
    );
}

function ScenePhone({ children, ringing = false }) {
    return (
        <div className={`w-16 h-28 rounded-2xl border-2 border-foreground/70 bg-card flex flex-col items-center justify-center gap-1 ${ringing ? "animate-phone-ring" : ""}`}>
            {children}
        </div>
    );
}

function Flow({ left, right, dotClass = "bg-accent" }) {
    return (
        <div className="flex items-center gap-3 sm:gap-6 animate-pop-in">
            {left}
            <div className="relative w-24 sm:w-36 h-8">
                <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-border" />
                <span className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${dotClass} animate-travel-dot`} />
            </div>
            {right}
        </div>
    );
}

function ParkingScene() {
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="text-5xl animate-float" aria-hidden="true">🛵</div>
            <Flow
                left={<SceneQr />}
                right={
                    <ScenePhone ringing>
                        <Smartphone className="h-6 w-6 text-accent" />
                        <span className="text-[9px] font-bold text-accent leading-tight text-center px-1">Wrong parking!</span>
                    </ScenePhone>
                }
            />
        </div>
    );
}

function CallbackScene() {
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-pop-in">
                <ShieldCheck className="h-3.5 w-3.5" /> Number masked
            </div>
            <Flow
                dotClass="bg-emerald-500"
                left={
                    <ScenePhone>
                        <Phone className="h-6 w-6 text-emerald-500" />
                        <span className="text-[9px] font-semibold text-muted-foreground">Finder</span>
                    </ScenePhone>
                }
                right={
                    <ScenePhone ringing>
                        <PhoneCall className="h-6 w-6 text-emerald-500" />
                        <span className="text-[9px] font-semibold text-muted-foreground">Owner</span>
                    </ScenePhone>
                }
            />
            <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center animate-shield-glow">
                <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
        </div>
    );
}

function FoundScene() {
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="text-5xl animate-float" aria-hidden="true">🧳</div>
            <Flow
                dotClass="bg-sky-500"
                left={<SceneQr />}
                right={
                    <ScenePhone ringing>
                        <MessageCircle className="h-6 w-6 text-sky-500" />
                        <span className="text-[9px] font-bold text-sky-500 leading-tight text-center px-1">Found it! 📍</span>
                    </ScenePhone>
                }
            />
        </div>
    );
}

function MedicalScene() {
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-emergency/10 border-2 border-emergency/40 flex items-center justify-center">
                <HeartPulse className="h-8 w-8 text-destructive animate-heartbeat" strokeWidth={2.4} />
            </div>
            <Flow
                dotClass="bg-destructive"
                left={<SceneQr />}
                right={
                    <div className="w-24 rounded-xl border-2 border-emergency/50 bg-emergency/5 p-2 text-center animate-pop-in">
                        <div className="text-lg font-black text-destructive">B+</div>
                        <div className="text-[9px] font-semibold text-muted-foreground leading-tight">Allergies · Contact</div>
                    </div>
                }
            />
        </div>
    );
}
