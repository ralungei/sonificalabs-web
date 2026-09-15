import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's built-in font sizes. Our type scale lives
 * in custom @utility classes (globals.css), and it read those as text *colours*:
 * in cn("text-label-md", active ? "text-accent" : "text-text-secondary") it
 * dropped text-label-md as a conflicting colour, so the text silently fell back
 * to the inherited 16px. Registering the scale as font sizes stops that.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl", "display-lg", "display-md", "display-sm",
            "heading-xl", "heading-lg", "heading-md", "heading-sm",
            "body-lg", "body-md", "body-sm",
            "caption-md", "caption-sm",
            "label-lg", "label-md", "label-sm",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
