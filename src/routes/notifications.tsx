import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Activity — ArcLedger" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const allNotifications = useStore((s) => s.notifications);
  const items = user ? allNotifications.filter((n) => n.userId === user.id) : [];
  const markAllRead = useStore((s) => s.markAllRead);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Activity</h1>
        <Button variant="outline" size="sm" onClick={() => markAllRead(user.id)}>Mark all read</Button>
      </div>
      <Card className="mt-4 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Bell className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-4 ${!n.read ? "bg-secondary/30" : ""}`}>
                <div className="mt-1 h-2 w-2 rounded-full" style={{ background: n.read ? "var(--muted-foreground)" : "var(--primary)" }} />
                <div className="flex-1">
                  <div className="text-sm">{n.message}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
