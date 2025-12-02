import "styled-components";
import type { Theme } from "./design-tokens";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}

