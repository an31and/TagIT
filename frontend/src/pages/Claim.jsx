import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../components/ui/button";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";

export default function ClaimPage() {
    const { slug } = useParams();
    const { user, loading } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            navigate(`/login?next=/claim/${slug}`, { replace: true });
        }
    }, [user, loading, slug, navigate]);

    const onClaim = async () => {
        setSubmitting(true);
        setError("");
        try {
            const { data } = await api.post(`/public/tags/${slug}/claim`);
            navigate(`/tags/${data.id}`, { replace: true });
        } catch (e) {
            setError(formatApiError(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full surface p-8 text-center space-y-4" data-testid="claim-root">
                <h1 className="font-display text-2xl font-bold tracking-tight">{t("claim.title")}</h1>
                <p className="text-sm text-muted-foreground">{t("claim.subtitle")}</p>
                <Button onClick={onClaim} disabled={submitting} className="rounded-full w-full" data-testid="claim-submit-btn">
                    {submitting ? t("common.loading") : t("claim.claim_button")}
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        </div>
    );
}
