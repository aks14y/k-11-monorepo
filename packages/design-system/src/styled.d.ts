import "styled-components";
import { Theme } from "./design-tokens";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}

