import { PageHeader } from "@/components/common/page-header";
import { StaffDataTable } from "@/components/game/staff-data-table";
import { getStaffDirectory } from "@/server/queries/roster";

export default async function StaffPage() {
  const staff = await getStaffDirectory().catch(() => []);

  const rows = staff.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    specialty: member.specialty,
    countryCode: member.countryCode,
    category: member.currentCategory?.code ?? "N/A",
    team: member.currentTeam?.name ?? "Free Agent",
    reputation: member.reputation,
    salary: member.salary,
    imageUrl: member.imageUrl,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations Personnel"
        title="Global Staff Network"
        description="Track technical leaders, strategists and program heads with active contracts across categories."
      />
      <StaffDataTable data={rows} />
    </div>
  );
}
