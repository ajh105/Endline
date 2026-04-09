import { useEffect, useState } from "react";

type DiceDisplayProps = {
  value: 1 | 2 | 3 | 4;
  rollKey: number;
};

function DiceDisplay({ value, rollKey }: DiceDisplayProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    setIsRolling(true);

    let tickCount = 0;
    const maxTicks = 8;

    const intervalId = window.setInterval(() => {
      tickCount += 1;
      setDisplayValue(((tickCount % 4) + 1) as 1 | 2 | 3 | 4);

      if (tickCount >= maxTicks) {
        window.clearInterval(intervalId);
        setDisplayValue(value);
        setIsRolling(false);
      }
    }, 70);

    return () => window.clearInterval(intervalId);
  }, [rollKey, value]);

  return (
    <div className={`endline-dice-value ${isRolling ? "rolling" : ""}`}>
      {displayValue}
    </div>
  );
}

export default DiceDisplay;