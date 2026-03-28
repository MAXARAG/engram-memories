import ComingSoon from "@/components/ComingSoon";
import { Syringe } from "lucide-react";

export default function SanidadPage() {
  return (
    <ComingSoon
      title="Sanidad"
      description="Controlá tratamientos, vacunaciones, productos aplicados, dosis y períodos de retiro por animal."
      icon={Syringe}
    />
  );
}
