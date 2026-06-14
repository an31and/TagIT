import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, MessageSquare } from "lucide-react";

import api, { formatApiError } from "../lib/api";
import { useI18n } from "../lib/i18n";

const ACTION_COPY = {
    message: "Message",
    wrong_parking: "Wrong parking",
    headlight_on: "Headlight left on",
    found: "Found",
    call_request: "Call request",
};

export default function InboxPage() {
    const { t } = useI18n();
    const [msgs, setMsgs] = useState(null);
    const [tags, setTags] = useState({});
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const [{ data: m }, { data: ts }] = await Promise.all([
                    api.get("/inbox"),
                    api.get("/tags"),
                ]);
                setMsgs(m);
                setTags(Object.fromEntries(ts.map((tg) => [tg.id, tg])));
            } catch (e) {
                setError(formatApiError(e));
            }
        })();
    }, []);

    return (
        <div className="space-y-6 max-w-3xl" data-testid="inbox-root">
            <h1 className="font-display text-3xl font-black tracking-tight">{t("common.inbox")}</h1>
            {msgs === null ? (
                <div className="text-muted-foreground animate-pulse-soft">{t("common.loading")}</div>
            ) : msgs.length === 0 ? (
                <div className="surface p-10 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground">No finder messages yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {msgs.map((m) => {
                        const tag = tags[m.tag_id];
                        return (
                            <div key={m.id} className="surface p-5 animate-rise" data-testid={`inbox-item-${m.id}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                                        {ACTION_COPY[m.action_type] || m.action_type}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(m.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="font-display font-bold mt-1">
                                    {tag ? tag.display_name || tag.label : "Tag"}
                                </div>
                                {m.body && <p className="text-sm mt-2 whitespace-pre-wrap">{m.body}</p>}
                                <div className="text-xs text-muted-foreground mt-3 flex flex-wrap gap-3 items-center">
                                    {m.finder_name && <span>From: {m.finder_name}</span>}
                                    {m.finder_contact && <span>· {m.finder_contact}</span>}
                                    {m.location && (
                                        <a
                                            href={`https://maps.google.com/?q=${m.location.lat},${m.location.lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-accent hover:underline"
                                        >
                                            <MapPin className="h-3.5 w-3.5" /> View location
                                        </a>
                                    )}
                                    {tag && (
                                        <Link to={`/tags/${tag.id}`} className="ml-auto text-accent hover:underline">
                                            Open tag
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
