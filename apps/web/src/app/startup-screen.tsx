import { useState, type AnimationEvent } from "react";

function LetterM() {
  return (
    <svg viewBox="0 0 57 53" aria-hidden="true">
      <path
        d="M-1.11461e-05 9.53674e-06H13.6534L28.0739 35.1818H28.6875L43.1079 9.53674e-06H56.7614V52.3636H46.0227V18.2813H45.5881L32.0369 52.108H24.7244L11.1733 18.1534H10.7386V52.3636H-1.11461e-05V9.53674e-06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LetterTail() {
  return (
    <svg viewBox="0 0 189 53" aria-hidden="true">
      <path
        d="M-1.11461e-05 52.3636V9.53674e-06H11.071V43.2358H33.5199V52.3636H-1.11461e-05ZM41.7516 52.3636V9.53674e-06H52.8226V43.2358H75.2714V52.3636H41.7516ZM94.5741 9.53674e-06V52.3636H83.5031V9.53674e-06H94.5741ZM104.583 52.3636V9.53674e-06H125.242C129.196 9.53674e-06 132.571 0.707396 135.367 2.12217C138.179 3.5199 140.319 5.50569 141.785 8.07956C143.267 10.6364 144.009 13.6449 144.009 17.1051C144.009 20.5824 143.259 23.5739 141.759 26.0796C140.259 28.5682 138.086 30.4773 135.239 31.8068C132.41 33.1364 128.983 33.8011 124.961 33.8011H111.128V24.9034H123.171C125.285 24.9034 127.04 24.6136 128.438 24.0341C129.836 23.4546 130.875 22.5852 131.557 21.4261C132.256 20.2671 132.606 18.8267 132.606 17.1051C132.606 15.3665 132.256 13.9006 131.557 12.7074C130.875 11.5142 129.827 10.6108 128.412 9.99717C127.015 9.36649 125.25 9.05115 123.12 9.05115H115.654V52.3636H104.583ZM132.861 28.5341L145.875 52.3636H133.654L120.921 28.5341H132.861ZM152.733 52.3636V9.53674e-06H188.017V9.12785H163.804V21.6051H186.202V30.733H163.804V43.2358H188.119V52.3636H152.733Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LetterO() {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true">
      <path
        className="startup-logo__mark"
        d="M19.25 7H49V36.75L36.75 49H7V19.25L19.25 7Z"
        fill="currentColor"
      />
      <path
        d="M28 16.625L41.125 29.75L36.575 34.3L28 25.725L19.425 34.3L14.875 29.75L28 16.625Z"
        fill="#0c0f16"
      />
    </svg>
  );
}

export function StartupScreen() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  function finish(event: AnimationEvent<HTMLDivElement>) {
    if (event.currentTarget === event.target && event.animationName === "startup-screen-exit") {
      setVisible(false);
    }
  }

  return (
    <div
      className="startup-screen"
      role="status"
      aria-label="Carregando Mollire"
      onAnimationEnd={finish}
    >
      <div className="startup-logo" aria-hidden="true">
        <span className="startup-logo__m"><LetterM /></span>
        <span className="startup-logo__o"><LetterO /></span>
        <span className="startup-logo__tail"><LetterTail /></span>
      </div>
      <span className="sr-only">Carregando Mollire</span>
    </div>
  );
}
