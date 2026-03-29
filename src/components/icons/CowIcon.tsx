import type { CSSProperties } from "react";

interface CowIconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function CowIcon({ size = 24, className, style }: CowIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M14 26C14 21.582 17.582 18 22 18H41C47.627 18 53 23.373 53 30V35C53 39.418 49.418 43 45 43H20C16.686 43 14 40.314 14 37V26Z"
        fill="currentColor"
      />
      <path
        d="M41 22C43.761 22 46 24.239 46 27V35C46 37.761 43.761 40 41 40H22C19.239 40 17 37.761 17 35V27C17 24.239 19.239 22 22 22H41Z"
        fill="#F7F1E7"
      />
      <path
        d="M41 18H47C52.523 18 57 22.477 57 28V31C57 36.523 52.523 41 47 41H44V25C44 21.134 40.866 18 37 18H41Z"
        fill="currentColor"
      />
      <path
        d="M52 18L55 12L49 14L47 18"
        fill="currentColor"
      />
      <path
        d="M58 19L61 14L55 15L54 19"
        fill="currentColor"
      />
      <ellipse cx="50.5" cy="28" rx="2.2" ry="2.4" fill="#121212" />
      <path
        d="M57 30.5C57 33.538 54.538 36 51.5 36H47V29H57V30.5Z"
        fill="#E6B8A2"
      />
      <circle cx="49" cy="32" r="1.1" fill="#8D5B46" />
      <circle cx="53" cy="32" r="1.1" fill="#8D5B46" />
      <path
        d="M25 28C25 25.791 26.791 24 29 24C31.209 24 33 25.791 33 28C33 30.209 31.209 32 29 32C26.791 32 25 30.209 25 28Z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M34 31C34 28.791 35.791 27 38 27C40.209 27 42 28.791 42 31C42 33.209 40.209 35 38 35C35.791 35 34 33.209 34 31Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M19 43H23V55C23 56.105 22.105 57 21 57C19.895 57 19 56.105 19 55V43Z"
        fill="currentColor"
      />
      <path
        d="M28 43H32V55C32 56.105 31.105 57 30 57C28.895 57 28 56.105 28 55V43Z"
        fill="currentColor"
      />
      <path
        d="M39 43H43V55C43 56.105 42.105 57 41 57C39.895 57 39 56.105 39 55V43Z"
        fill="currentColor"
      />
      <path
        d="M48 42H52V54C52 55.105 51.105 56 50 56C48.895 56 48 55.105 48 54V42Z"
        fill="currentColor"
      />
      <path
        d="M14 23C11.791 23 10 24.791 10 27V34"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M10 34C10 36.761 7.761 39 5 39"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M44 36.5C44 38.433 42.433 40 40.5 40H19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.12"
      />
    </svg>
  );
}