import { useTranslation } from "react-i18next";

export default function HistoryPage() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-white mb-4">{t("nav.history", "History")}</h2>
      <p className="text-sm text-stellar-muted">Transaction history will appear here.</p>
    </div>
  );
}