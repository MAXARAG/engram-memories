import ComingSoon from "@/components/ComingSoon";
import { Scissors } from "lucide-react";

export default function FaenaPage() {
  return (
    <ComingSoon
      title="Faena"
      description="Registrá los datos de faena: peso vivo, peso de canal, rendimiento y observaciones por animal."
      icon={Scissors}
    />
  );
}
