import ComingSoon from "@/components/ComingSoon";
import { Beef } from "lucide-react";

export default function AnimalesPage() {
  return (
    <ComingSoon
      title="Animales"
      description="Registrá y gestioná todo el stock de tu establecimiento: especie, categoría, raza, estado sanitario y más."
      icon={Beef}
    />
  );
}
