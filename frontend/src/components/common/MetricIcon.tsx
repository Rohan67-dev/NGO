import React from 'react';
import { Users, Utensils, Trees, GraduationCap, Heart, Home, Droplets, Palette, Sparkles, LucideProps } from 'lucide-react';

/** Icons an admin can pick for an impact metric (the value stored is the icon name). */
export const METRIC_ICONS: Record<string, React.FC<LucideProps>> = {
  Users,
  Utensils,
  Trees,
  GraduationCap,
  Heart,
  Home,
  Droplets,
  Palette,
  Sparkles,
};

export const MetricIcon: React.FC<{ name?: string; className?: string }> = ({ name, className }) => {
  const Icon = (name && METRIC_ICONS[name]) || Sparkles;
  return <Icon className={className} aria-hidden="true" />;
};
