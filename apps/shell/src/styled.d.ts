import "styled-components";
import { Theme } from "@design-system";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}

