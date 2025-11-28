import "styled-components";
import type { Theme } from "@design-system";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}

