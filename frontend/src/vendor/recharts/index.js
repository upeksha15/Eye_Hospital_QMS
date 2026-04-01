import React from 'react';

// Minimal shim of the Recharts components used in the admin pages.
// These components render simple wrappers so the app can build without the
// actual `recharts` dependency. They accept children/props used by pages.

export const ResponsiveContainer = ({ children, width='100%', height='100%' }) => (
  <div style={{ width, height }}>
    {children}
  </div>
);

export const LineChart = ({ children }) => (
  <div className="recharts-shim">
    {children}
  </div>
);

export const Line = () => null;
export const XAxis = () => null;
export const YAxis = () => null;
export const CartesianGrid = () => null;
export const Tooltip = () => null;
export const Legend = () => null;
export const BarChart = ({ children }) => (
  <div className="recharts-shim">{children}</div>
);
export const Bar = () => null;

export default {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
};
