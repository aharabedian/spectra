declare namespace App {
  interface Locals {
    /** The docs switcher's tabs, set by src/route-middleware.ts. */
    spectraDocsTabs?: import('./route-middleware').DocsTab[];
  }
}
