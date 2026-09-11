import { redirect } from "next/navigation";

/**
 * Tak n'a plus d'écran dédié : c'est une bulle flottante présente sur
 * toutes les pages (voir `TakWidget`). D'anciens liens vers /tak renvoient
 * simplement vers l'accueil.
 */
export default function TakPage() {
  redirect("/");
}
