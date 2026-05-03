"use client";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Props = {
  eventId: string;
  registrationId: string;
  token: string;
};

export function RegistrationQR({ eventId, registrationId, token }: Props) {
  const { t } = useLocale();
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BROWSER_API_URL ?? "http://localhost:8000/api/v1";
    const url = `${baseUrl}/events/${eventId}/registrations/${registrationId}/qr`;

    let objectUrl: string | null = null;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setError(true));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [eventId, registrationId, token]);

  if (error) return <p className="text-xs text-danger">{t("qr.unavailable")}</p>;
  if (!src)
    return (
      <div className="h-20 w-20 rounded bg-surface-raised animate-pulse" />
    );

  return (
    <img
      src={src}
      alt={t("qr.registration_alt")}
      width={80}
      height={80}
      className="rounded border border-border"
    />
  );
}
