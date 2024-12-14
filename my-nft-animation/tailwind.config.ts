import { withAccountKitUi, createColorSet } from "@account-kit/react/tailwind";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@account-kit/react/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};

export default withAccountKitUi(config, {
  colors: {
    "btn-primary": createColorSet("#E82594", "#FF66CC"),
    "fg-accent-brand": createColorSet("#E82594", "#FF66CC"),
  },
});
