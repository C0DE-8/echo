export type EchoNetworkName = "local" | "testnet" | "mainnet";

export type EchoNetwork = {
  readonly name: EchoNetworkName;
  readonly humanReadablePart: string;
  readonly addressVersion: number;
};

export const ECHO_NETWORKS = {
  local: { name: "local", humanReadablePart: "echolocal", addressVersion: 0 },
  testnet: { name: "testnet", humanReadablePart: "echotest", addressVersion: 0 },
  mainnet: { name: "mainnet", humanReadablePart: "echo", addressVersion: 0 }
} as const satisfies Record<EchoNetworkName, EchoNetwork>;

// Returns a configured ECHO network by looking up its protocol-defined network name.
export function getNetwork(networkName: EchoNetworkName): EchoNetwork {
  return ECHO_NETWORKS[networkName];
}

// Returns a configured ECHO network by matching the Bech32 human-readable network prefix.
export function getNetworkByHumanReadablePart(humanReadablePart: string): EchoNetwork | undefined {
  const normalizedPart = humanReadablePart.toLowerCase();

  for (const network of Object.values(ECHO_NETWORKS)) {
    if (network.humanReadablePart === normalizedPart) {
      return network;
    }
  }

  return undefined;
}
