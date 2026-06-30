import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Bike,
    Briefcase,
    HeartPulse,
    KeyRound,
    PawPrint,
    QrCode,
    ScanLine,
    ShieldCheck,
    Smartphone,
    Tag,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { SponsorSection } from "../components/SponsorSection";
import { ThemeToggle } from "../components/ThemeToggle";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";

const TAG_TYPES = [
    { key: "vehicle", icon: Bike, color: "text-accent" },
    { key: "pet", icon: PawPrint, color: "text-emerald-500" },
    { key: "luggage", icon: Briefcase, color: "text-sky-500" },
    { key: "keys", icon: KeyRound, color: "text-amber-500" },
    { key: "medical", icon: HeartPulse, color: "text-destructive" },
];

export default function LandingPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <header className="border-b">
                <div className="mx-auto max-w-6xl px-4 sm:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-display font-black text-xl tracking-tight" data-testid="landing-brand">
                        <Tag className="h-5 w-5 text-accent" strokeWidth={2.5} />
                        <span>Tag<span className="text-accent">IT</span></span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher compact />
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(user ? "/dashboard" : "/login")}
                            data-testid="landing-sign-in"
                        >
                            {t("common.sign_in")}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => navigate(user ? "/dashboard" : "/signup")}
                            data-testid="landing-sign-up"
                        >
                            {user ? t("common.dashboard") : t("common.sign_up")}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
                <div className="relative mx-auto max-w-6xl px-4 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 animate-rise">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-card text-xs font-semibold tracking-wider uppercase">
                            <span className="h-2 w-2 rounded-full bg-accent" /> {t("landing.hero_kicker")}
                        </span>
                        <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95]">
                            {t("landing.hero_title")}
                        </h1>
                        <p className="mt-5 text-lg text-muted-foreground max-w-xl">
                            {t("landing.hero_subtitle")}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button size="lg" className="rounded-full" onClick={() => navigate(user ? "/dashboard" : "/signup")} data-testid="hero-cta-primary">
                                {t("landing.cta_primary")} <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                data-testid="hero-cta-secondary"
                            >
                                {t("landing.cta_secondary")}
                            </Button>
                        </div>
                        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border">
                                🇮🇳 {t("common.made_in_india")}
                            </span>
                            <span>· {t("common.free_public_service")}</span>
                        </div>
                    </div>

                    {/* Visual: stacked tag types */}
                    <div className="lg:col-span-5">
                        <div className="surface p-8 sm:p-10 relative">
                            <div className="flex items-center justify-between mb-6">
                                <div className="font-display font-bold text-lg">{t("landing.tag_for_everything")}</div>
                                <ScanLine className="h-5 w-5 text-accent" />
                            </div>
                            <ul className="grid grid-cols-2 gap-3">
                                {TAG_TYPES.map(({ key, icon: Icon, color }) => (
                                    <li key={key} className="flex items-center gap-3 p-3 rounded-lg border bg-background/60">
                                        <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.2} />
                                        <span className="font-medium capitalize">{t(`dashboard.${key}`)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 p-4 rounded-lg bg-emergency/10 border border-emergency/30">
                                <div className="flex items-start gap-3">
                                    <HeartPulse className="h-5 w-5 text-destructive shrink-0 mt-0.5" strokeWidth={2.5} />
                                    <div>
                                        <div className="font-display font-bold text-sm">{t("landing.feature_emergency")}</div>
                                        <p className="text-xs text-muted-foreground mt-1">{t("landing.feature_emergency_desc")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="border-y bg-muted/30">
                <div className="mx-auto max-w-6xl px-4 sm:px-8 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Feature
                        icon={<Smartphone className="h-5 w-5" />}
                        title={t("landing.feature_no_app")}
                        body={t("landing.feature_no_app_desc")}
                    />
                    <Feature
                        icon={<ShieldCheck className="h-5 w-5" />}
                        title={t("landing.feature_privacy")}
                        body={t("landing.feature_privacy_desc")}
                    />
                    <Feature
                        icon={<HeartPulse className="h-5 w-5 text-destructive" />}
                        title={t("landing.feature_emergency")}
                        body={t("landing.feature_emergency_desc")}
                        emergency
                    />
                    <Feature
                        icon={<span className="text-sm">🇮🇳</span>}
                        title={t("landing.feature_made_in_india")}
                        body={t("landing.feature_made_in_india_desc")}
                    />
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="mx-auto max-w-6xl px-4 sm:px-8 py-16">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{t("landing.how_it_works")}</h2>
                <div className="mt-8 grid md:grid-cols-3 gap-6">
                    <Step n="1" icon={<Tag className="h-5 w-5" />} title={t("landing.how_step_1")} body={t("landing.how_step_1_desc")} />
                    <Step n="2" icon={<QrCode className="h-5 w-5" />} title={t("landing.how_step_2")} body={t("landing.how_step_2_desc")} />
                    <Step n="3" icon={<ScanLine className="h-5 w-5" />} title={t("landing.how_step_3")} body={t("landing.how_step_3_desc")} />
                </div>
            </section>

            {/* Sponsor a tag — civic enhancement */}
            <SponsorSection />

            <footer className="border-t mt-10">
                <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 grid sm:grid-cols-2 gap-6 text-sm">
                    <div>
                        <div className="font-display font-black text-lg">Tag<span className="text-accent">IT</span></div>
                        <p className="text-muted-foreground mt-2 max-w-md">{t("common.tagline")}</p>
                        <p className="text-xs mt-3 text-muted-foreground">
                            Founder · Anand Lakhera · an.31and@gmail.com · +91 89042 23100
                        </p>
                    </div>
                    <div className="sm:text-right flex sm:justify-end gap-5 flex-wrap items-center">
                        <Link to="/privacy" className="hover:text-accent" data-testid="footer-privacy">{t("legal.privacy")}</Link>
                        <Link to="/terms" className="hover:text-accent" data-testid="footer-terms">{t("legal.terms")}</Link>
                        <Link to="/medical-disclaimer" className="hover:text-accent" data-testid="footer-medical">{t("legal.medical_disclaimer")}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function Feature({ icon, title, body, emergency }) {
    return (
        <div className={`surface p-6 ${emergency ? "border-emergency/40" : ""}`}>
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${emergency ? "bg-emergency/10" : "bg-accent/10"} mb-4`}>{icon}</div>
            <div className="font-display font-bold">{title}</div>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{body}</p>
        </div>
    );
}

function Step({ n, icon, title, body }) {
    return (
        <div className="surface p-6 relative animate-rise">
            <div className="absolute top-4 right-4 font-display font-black text-4xl text-accent/30 leading-none">{n}</div>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground mb-4">{icon}</div>
            <div className="font-display font-bold">{title}</div>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{body}</p>
        </div>
    );
}
