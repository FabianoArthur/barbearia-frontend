import { Link } from "react-router-dom";
import { BookingWizard } from "./components/BookingWizard";
import { BRAND } from "@/config/brand";

export default function PublicBookingPage() {
  return (
    <>
      <div
        className="relative bg-cover bg-center py-20 text-center"
        style={{
          background: `linear-gradient(to bottom, transparent 55%, hsl(0 0% 7%)), ${BRAND.backdrop}`,
        }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
          AGENDAMENTO VIP
        </h2>
        <p className="text-primary mt-2 text-lg">
          Escolha o melhor para o seu estilo.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10 pb-12">
        <BookingWizard />
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center pb-8">
        <Link
          to="/confirm"
          className="text-sm text-muted-foreground hover:text-primary underline"
        >
          Ja tem um agendamento? Gerencie aqui
        </Link>
      </div>
    </>
  );
}
