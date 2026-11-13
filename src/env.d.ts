declare namespace App {
  interface Locals {
    /** Where the top bar's project links go from a docs page, by project id. Set by src/route-middleware.ts. */
    spectraDocsHrefs?: Record<string, string>;
  }
}
