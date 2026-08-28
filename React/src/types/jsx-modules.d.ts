declare module '*.jsx' {
  import type { ComponentType } from 'react';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component: ComponentType<any>;
  export default Component;
}
