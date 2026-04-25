import { PageHeader } from "@/components/common/page-header";
import { StaffDataTable } from "@/components/game/staff-data-table";
import { getServerTranslator } from "@/i18n/server";
import { getStaffDirectory } from "@/server/queries/roster";

export default async function StaffPage() {
  const { t } = await getServerTranslator();
  const staff = await getStaffDirectory().catch(() => []);

  const rows = staff.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    specialty: member.specialty,
    countryCode: member.countryCode,
    category: member.currentCategory?.code ?? "N/A",
    team: member.currentTeam?.name ?? t("common.freeAgent"),
    reputation: member.reputation,
    salary: member.salary,
    imageUrl: member.imageUrl,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("staff.pageEyebrow")}
        title={t("staff.pageTitle")}
        description={t("staff.pageDescription")}
      />
      <StaffDataTable data={rows} />
    </div>
  );
}
