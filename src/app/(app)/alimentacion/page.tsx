import ComingSoon from "@/components/ComingSoon";
import { Wheat } from "lucide-react";

export default function AlimentacionPage() {
  return (
    <ComingSoon
      title="Alimentación"
      description="Registrá las raciones diarias, consumo por categoría, costos de alimentos y seguimiento nutricional."
      icon={Wheat}
    />
  );
}
