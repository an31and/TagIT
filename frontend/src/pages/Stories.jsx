/**
 * Stories — little real-life tales, one per use case, in very simple words.
 * All copy lives in i18n (EN + HI); other languages fall back to English.
 */
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpenText, Tag } from "lucide-react";

import { Button } from "../components/ui/button";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ThemeToggle";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export const STORY_KEYS = [
    { key: "s1", emoji: "🛵" },
    { key: "s2", emoji: "🔑" },
    { key: "s3", emoji: "🧳" },
    { key: "s4", emoji: "🐕" },
    { key: "s5", emoji: "🎒" },
    { key: "s6", emoji: "👴" },
    { key: "s7", emoji: "🤝" },
    { key: "s8", emoji: "🚑" },
];

export default function StoriesPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                    <Link to="/" className="flex items-center gap-2 font-display font-black text-xl tracking-tight" data-testid="stories-brand">
                        <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground grid place-items-center">
                            <Tag className="h-4 w-4" strokeWidth={2.5} />
                        </span>
                        <span>Info-<span className="text-accent">Tag</span></span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher compact />
                        <ThemeToggle />
                        <Button size="sm" className="rounded-full" onClick={() => navigate(user ? "/dashboard" : "/signup")}>
                            {user ? t("common.dashboard") : t("landing.cta_primary")}
                        </Button>
                    </div>
                </div>
            </nav>

            <header className="mx-auto max-w-3xl px-4 sm:px-6 pt-12 pb-4">
                <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> {t("common.back")}
                </Link>
                <div className="mt-6 flex items-center gap-2">
                    <BookOpenText className="h-6 w-6 text-accent" />
                    <span className="font-mono text-xs tracking-[0.14em] uppercase text-accent">{t("stories.kicker")}</span>
                </div>
                <h1 className="mt-3 font-display text-3xl sm:text-5xl font-black tracking-tight">{t("stories.title")}</h1>
                <p className="mt-3 text-muted-foreground max-w-xl">{t("stories.lead")}</p>
            </header>

            <main className="mx-auto max-w-3xl px-4 sm:px-6 pb-16 space-y-6">
                {STORY_KEYS.map(({ key, emoji }, i) => (
                    <article key={key} className="surface p-6 sm:p-8 reveal-static animate-rise" style={{ animationDelay: `${i * 0.06}s` }} data-testid={`story-${key}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl" aria-hidden="true">{emoji}</span>
                            <div>
                                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-accent">{t(`stories.${key}_tag`)}</div>
                                <h2 className="font-display font-bold text-xl leading-tight">{t(`stories.${key}_title`)}</h2>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                            <p>{t(`stories.${key}_p1`)}</p>
                            <p>{t(`stories.${key}_p2`)}</p>
                            <p className="text-foreground font-medium">{t(`stories.${key}_p3`)}</p>
                        </div>
                    </article>
                ))}

                <div className="rounded-3xl px-6 py-10 text-center text-white bg-gradient-to-br from-accent to-orange-700">
                    <h2 className="font-display text-2xl font-bold">{t("stories.cta_title")}</h2>
                    <p className="mt-1 opacity-90">{t("stories.cta_sub")}</p>
                    <Button
                        size="lg"
                        className="mt-5 rounded-full bg-white text-orange-700 hover:bg-white/90"
                        onClick={() => navigate(user ? "/dashboard" : "/signup")}
                        data-testid="stories-cta"
                    >
                        {t("landing.cta_primary")} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </main>
        </div>
    );
}
