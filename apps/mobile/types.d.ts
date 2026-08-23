declare module '*.css' {}

// Deep imports bypass the lucide-react-native barrel to keep unused icons out
// of the JS bundle. The package ships no per-icon .d.ts, so declare them here.
declare module 'lucide-react-native/dist/esm/icons/*' {
  import type { LucideIcon } from 'lucide-react-native';

  const Icon: LucideIcon;
  export default Icon;
}
