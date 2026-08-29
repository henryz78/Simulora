export type AuthenticatedAccount = {
  accountId: string;
  eligibility: "adult" | "ineligible" | "unknown";
};

export interface AuthPort {
  authenticate(
    headers: Readonly<Record<string, string | string[] | undefined>>,
  ): Promise<AuthenticatedAccount | null>;
}

export class DevelopmentAuthAdapter implements AuthPort {
  authenticate(
    _headers: Readonly<Record<string, string | string[] | undefined>>,
  ): Promise<AuthenticatedAccount> {
    return Promise.resolve({ accountId: "development-account", eligibility: "adult" });
  }
}
