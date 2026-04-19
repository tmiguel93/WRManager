import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSuppliersView } from "@/server/queries/world";

export default async function SuppliersPage() {
  const suppliers = await getSuppliersView().catch(() => []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partnership Network"
        title="Suppliers Marketplace"
        description="Base inicial de fornecedores multi-categoria com compatibilidade, performance, custo e impacto de prestígio."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="premium-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">{supplier.name}</CardTitle>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {supplier.type.replaceAll("_", " ")} • {supplier.categories.map((item) => item.category.code).join(", ")}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Reliability</span>
                  <span>{supplier.reliability}</span>
                </div>
                <Progress value={supplier.reliability} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Performance</span>
                  <span>{supplier.performance}</span>
                </div>
                <Progress value={supplier.performance} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Efficiency</span>
                  <span>{supplier.efficiency}</span>
                </div>
                <Progress value={supplier.efficiency} />
              </div>
              <p className="pt-2 text-xs text-muted-foreground">Annual Cost ${supplier.baseCost.toLocaleString("en-US")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
