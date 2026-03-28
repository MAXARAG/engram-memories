import ComingSoon from "@/components/ComingSoon";
import { DollarSign } from "lucide-react";

export default function CostosPage() {
  return (
    <ComingSoon
      title="Costos"
      description="Registrá y analizá todos los costos del establecimiento: fijos, variables, por especie y categoría."
      icon={DollarSign}
    />
  );
}
