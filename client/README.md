# Kisaan Chakshu client

The client now contains a responsive introductory landing page built with Next.js App Router, TypeScript, Tailwind CSS, and Lucide icons.

## Run locally

Requires Node.js 20.9 or later and pnpm. On Windows PowerShell, use `pnpm.cmd` if execution policy blocks script wrappers.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000.

```sh
pnpm typecheck
pnpm build
pnpm start
```

## Implemented

- Original ivory, forest green, saffron, and gold visual theme inspired by the supplied Build for Bharat heritage poster.
- Spacious presentation inspired by DaemonDoc's website, with original project copy and an original SVG farmland illustration. No reference website content or imagery is reused.
- Landing page explaining the intended claim workflow, three evidence perspectives, farmer and officer roles, and project limits.
- Responsive navigation, keyboard-accessible evidence tabs, native FAQ disclosures, section links, skip navigation, and reduced-motion support.
- Local assets, CSS paper texture, and system font stacks; no external font, image, analytics, or API requests are required by the page.

## Planned

The farmer portal, officer dashboard, claim submission, policy checks, evidence processing, reports, authentication, and API connections remain unimplemented. Existing portal route placeholders explicitly return 404 so the client compiles without presenting empty placeholders as working screens. All landing-page buttons lead to informational sections on the landing page.

The evidence visual is labeled illustrative. No live assessments, claim statistics, customer testimonials, or payout promises are presented. The MVP is intended to use synthetic farmer and policy records.

## Files

- `src/app/page.tsx`: landing-page entry point.
- `src/app/layout.tsx`: document and metadata.
- `src/app/globals.css`: theme, layouts, responsive styling, and Tailwind import.
- `src/components/landing-page.tsx`: content and local interactions.
- `public/images/fields.svg`: original farmland illustration.

Work in this step is contained in `client/`. The root README's older statement that all application code is unimplemented predates this client implementation; server functionality described there remains planned.
