import { useEffect, useState } from "react";

// `value`, but only after it has stopped changing for `delayMs`: for what
// feeds a request while the user is still typing.
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
