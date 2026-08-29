export type ModelGatewayStatus = {
  adapter: "deterministic";
  liveProviderConfigured: false;
};

export interface ModelGatewayPort {
  status(): Promise<ModelGatewayStatus>;
}

export class DeterministicModelGateway implements ModelGatewayPort {
  status(): Promise<ModelGatewayStatus> {
    return Promise.resolve({ adapter: "deterministic", liveProviderConfigured: false });
  }
}
