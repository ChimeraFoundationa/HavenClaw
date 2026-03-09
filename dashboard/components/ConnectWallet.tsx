"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";
import { formatAddress } from "../lib/wagmi-config";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono">{formatAddress(address)}</span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Copy address"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
          title="Disconnect"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="btn-primary flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Connect</span>
        </button>
      ))}
    </div>
  );
}
