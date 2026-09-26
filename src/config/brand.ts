/**
 * Shop branding shown in the header, login and booking pages.
 * "Fio de Navalha" is a fictional brand used for this open-source project.
 */
export const BRAND = {
  /** Full name, used for alt text and accessible labels. */
  name: "Barbearia Fio de Navalha",
  /** Short prefix rendered in neutral colour before the highlighted part. */
  prefix: "Barbearia",
  /** Highlighted part of the wordmark. */
  highlight: "Fio de Navalha",
  logo: `${import.meta.env.BASE_URL}brand-logo.svg`,
  /** Photo-free backdrop: warm light, soft barber-pole stripes, near black. */
  backdrop: [
    "radial-gradient(ellipse at 18% 0%, rgba(212,167,44,0.30), transparent 55%)",
    "radial-gradient(ellipse at 88% 35%, rgba(212,167,44,0.14), transparent 50%)",
    "repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 14px, transparent 14px 28px)",
    "#121212",
  ].join(", "),
} as const;
