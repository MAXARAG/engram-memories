import ComingSoon from "@/components/ComingSoon";
import { ArrowLeftRight } from "lucide-react";

export default function MovimientosPage() {
  return (
    <ComingSoon
      title="Movimientos"
      description="Registrá altas, bajas y traslados de animales con motivo, destino y observaciones."
      icon={ArrowLeftRight}
    />
  );
}
