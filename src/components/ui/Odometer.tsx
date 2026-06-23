import React from 'react';
import CountUpModule from 'react-countup';

// Log this to your terminal/browser console so we can see exactly how Vite is packing it
console.log("CountUp Library Payload Structure:", CountUpModule);

// Sift through the module object layers to find the functional component instance
const extractCountUp = () => {
  if (!CountUpModule) return null;
  
  // 1. Check if it's nested directly under .CountUp
  if ((CountUpModule as any).CountUp) return (CountUpModule as any).CountUp;
  
  // 2. Check if it's nested inside a double-default structure (Vite caching quirk)
  if ((CountUpModule as any).default?.CountUp) return (CountUpModule as any).default.CountUp;
  if ((CountUpModule as any).default?.default) return (CountUpModule as any).default.default;
  
  // 3. Fall back to standard default
  if ((CountUpModule as any).default) return (CountUpModule as any).default;
  
  // 4. If the object itself is the function
  if (typeof CountUpModule === 'function') return CountUpModule;
  
  return null;
};

const CountUpComponent = extractCountUp();

interface OdometerProps {
  amount: number; // Stored securely in Paisa
}

const Odometer: React.FC<OdometerProps> = ({ amount }) => {
  const amountInRupees = amount / 100;

  // Emergency safety system: If the object structure cannot be read, display static text
  if (!CountUpComponent) {
    return <span style={{ fontWeight: 600 }}>₹{amountInRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
  }

  return (
    <CountUpComponent
      start={0}
      end={amountInRupees}
      decimals={2}
      duration={2.0}
      separator=","
      prefix="₹"
    />
  );
};

export default Odometer;
