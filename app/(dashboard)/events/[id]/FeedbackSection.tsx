"use client";

import { useState, useEffect } from "react";

type FeedbackItem = {
  id: string;
  rating: number;
  comentariu: string | null;
  created_at: string;
};

type FeedbackResponse = {
  items: FeedbackItem[];
  average_rating: number | null;
};

type Props = {
  eventId: string;
  eventEndDate: string;
};

export default function FeedbackSection({ eventId, eventEndDate }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    setHasEnded(new Date() > new Date(eventEndDate));
  }, [eventEndDate]);

  useEffect(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BROWSER_API_URL ?? "http://localhost:8000/api/v1";
    fetch(`${baseUrl}/events/${eventId}/feedback`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          setFetchError(true);
          return;
        }
        const data = (await res.json()) as FeedbackResponse;
        setFeedback(data);
      })
      .catch(() => setFetchError(true));
  }, [eventId, submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || rating === 0) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BROWSER_API_URL ?? "http://localhost:8000/api/v1";
      const res = await fetch(`${baseUrl}/events/${eventId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comentariu: comment || null }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  }

  if (!token || !hasEnded) return null;
  if (fetchError) return null;

  return (
    <div className="border-t border-border pt-6 space-y-4">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
        Feedback
      </h2>

      {feedback && feedback.average_rating !== null && (
        <p className="text-sm text-text">
          Average rating:{" "}
          <span className="font-semibold">
            {"★".repeat(Math.round(feedback.average_rating))}
            {"☆".repeat(5 - Math.round(feedback.average_rating))}
          </span>{" "}
          ({feedback.average_rating.toFixed(1)})
        </p>
      )}

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-muted uppercase tracking-wider">Your rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="text-2xl transition-colors"
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                {star <= (hovered || rating) ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit feedback"}
          </button>
        </form>
      ) : (
        <p className="rounded-xl border border-success/30 bg-success-bg px-4 py-3 text-sm text-success">
          Thank you for your feedback!
        </p>
      )}

      {feedback && feedback.items.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted uppercase tracking-wider">Reviews</p>
          {feedback.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-surface p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text">
                  {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                </span>
                <span className="text-xs text-muted">Anonymous</span>
              </div>
              {item.comentariu && (
                <p className="text-sm text-text">{item.comentariu}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
