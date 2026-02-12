import { CSSProperties, HTMLAttributes, JSX, ReactNode } from "react";

type Props = {
  children: ReactNode;
  content: string;
  className?: string;
  style?: CSSProperties;
  tooltipStyle?: CSSProperties;
} & HTMLAttributes<HTMLDivElement>;

export const Tooltip = ({
  children,
  content,
  className,
  style,
  tooltipStyle,
  ...rest
}: Props): JSX.Element => {
  return (
    <div
      className={`relative flex flex-row items-end group ${className}`}
      style={style}
      {...rest}
    >
      {children}
      {content && (
        <div
          className="absolute bottom-full left-1/2 mb-2 z-50 -translate-x-1/2 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap
        before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2
        before:border-8 before:border-transparent before:border-t-gray-900"
          style={tooltipStyle}
        >
          {content}
        </div>
      )}
    </div>
  );
};
