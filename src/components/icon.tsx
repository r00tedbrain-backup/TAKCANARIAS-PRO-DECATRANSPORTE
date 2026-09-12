import type { CSSProperties } from "react";

type IconName = "arrow" | "external" | "phone" | "pin" | "chevron" | "close" | "menu" | "shield" | "truck" | "book" | "car" | "graduate" | "document" | "download" | "user" | "check";

const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  external: <path d="M6 18 18 6M6 6h12v12" />,
  phone: <path d="m8 3 3 5-3 3a16 16 0 0 0 5 5l3-3 5 3-1 4c-1 3-9-1-13-5S-1 3 2 2Z" />,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  shield: <><path d="m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5Z" /><path d="m8 11 3 3 5-5" /></>,
  truck: <><path d="M2 5h12v12H2Zm12 4h4l4 5v3h-8M18 9v5h4" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  book: <path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" />,
  car: <><path d="m4 10 2-6h12l2 6M3 10h18v9h-3v-2H6v2H3Zm3 3h2m8 0h2" /></>,
  graduate: <><path d="m2 8 10-5 10 5-10 5Zm4 3v6c4 3 8 3 12 0v-6m4-3v9" /></>,
  document: <><path d="M5 2h9l5 5v15H5Zm9 0v6h5M8 12h8m-8 4h8" /></>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  user: <><circle cx="12" cy="7" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>,
  check: <path d="m5 12 4 4L19 6" />,
};

export function Icon({ name, className, style }: { name: IconName; className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
