import { type ReactNode, useState } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export const Accordion = ({ title, children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col rounded-xl border border-amber-100/80 bg-white/60 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-amber-50/80"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <svg
          className={`h-5 w-5 shrink-0 text-amber-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-amber-100/80 px-4 py-3 bg-white/40">
          {children}
        </div>
      )}
    </div>
  );
};
