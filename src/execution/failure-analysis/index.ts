export type FailureCategory = "LOCATOR_MISMATCH" | "TIMEOUT" | "ASSERTION_ERROR" | "NETWORK_ERROR" | "UNKNOWN";

export interface FailureDiagnosis {
  category: FailureCategory;
  message: string;
  suggestedAction: "RETRY" | "REPAIR_LOCATOR" | "UPDATE_ASSERTION" | "INVESTIGATE";
}

export class FailureAnalyzer {
  diagnose(errorOutput: string): FailureDiagnosis {
    if (errorOutput.includes("waiting for locator") || errorOutput.includes("strict mode violation")) {
      return {
        category: "LOCATOR_MISMATCH",
        message: "Target locator could not be resolved or resolved to multiple elements",
        suggestedAction: "REPAIR_LOCATOR",
      };
    }
    if (errorOutput.includes("Timeout") || errorOutput.includes("timeout exceeded")) {
      return {
        category: "TIMEOUT",
        message: "Page load or element interaction timed out",
        suggestedAction: "RETRY",
      };
    }
    if (errorOutput.includes("expect(") || errorOutput.includes("AssertionError")) {
      return {
        category: "ASSERTION_ERROR",
        message: "Assertion condition was not met by application state",
        suggestedAction: "UPDATE_ASSERTION",
      };
    }
    return {
      category: "UNKNOWN",
      message: "Unclassified failure occurred during test run",
      suggestedAction: "INVESTIGATE",
    };
  }
}
