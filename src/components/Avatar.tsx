import Image from "next/image";
import type { Member } from "@/lib/types";
import { accentClasses } from "@/lib/accents";

interface AvatarProps {
  member: Member;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
}

const SIZES = {
  sm: { box: "h-10 w-10", emoji: "text-xl", pixels: 40, ring: "p-1" },
  md: { box: "h-14 w-14", emoji: "text-3xl", pixels: 56, ring: "p-1" },
  lg: { box: "h-20 w-20 sm:h-24 sm:w-24", emoji: "text-4xl sm:text-5xl", pixels: 96, ring: "p-1.5" },
} as const;

/** Photo de profil ronde, avec un emoji tant qu'aucune photo n'est importée. */
export function Avatar({ member, size = "md", selected = false }: AvatarProps) {
  const accent = accentClasses(member.accent);
  const dimensions = SIZES[size];

  return (
    <span
      className={`flex ${dimensions.box} shrink-0 items-center justify-center overflow-hidden rounded-full ${accent.soft} ${
        // Une vraie photo couvre tout le cercle : une marge laisse
        // apparaître le fond de couleur en anneau, pour garder ce repère
        // visuel propre à chaque membre.
        member.photoUrl ? dimensions.ring : ""
      } ${selected ? `ring-3 ring-offset-2 ring-offset-cream ${accent.ring}` : ""}`}
    >
      {member.photoUrl ? (
        <Image
          src={member.photoUrl}
          alt={member.firstName}
          width={dimensions.pixels}
          height={dimensions.pixels}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className={dimensions.emoji} aria-hidden>
          {member.avatarEmoji}
        </span>
      )}
    </span>
  );
}
