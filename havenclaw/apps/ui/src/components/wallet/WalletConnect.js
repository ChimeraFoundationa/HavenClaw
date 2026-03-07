import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from '@/components/ui/Button';
export function WalletConnect() {
    const { address, isConnected, chain } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();
    const [isConnecting, setIsConnecting] = useState(false);
    const FUJI_CHAIN_ID = 43113;
    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            connect({ connector: injected() });
        }
        catch (error) {
            console.error('Failed to connect:', error);
        }
        finally {
            setIsConnecting(false);
        }
    };
    const handleSwitchToFuji = async () => {
        try {
            switchChain({ chainId: FUJI_CHAIN_ID });
        }
        catch (error) {
            console.error('Failed to switch chain:', error);
        }
    };
    const shortenAddress = (addr) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };
    if (isConnected) {
        return (_jsxs("div", { className: "flex items-center gap-3", children: [chain?.id !== FUJI_CHAIN_ID && (_jsx(Button, { variant: "outline", size: "sm", onClick: handleSwitchToFuji, className: "border-amber-500 text-amber-600 hover:bg-amber-50", children: "\u26A0\uFE0F Switch to Fuji" })), _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg", children: [_jsx("span", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-sm font-medium text-indigo-900", children: shortenAddress(address || '') })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => disconnect(), className: "text-gray-500 hover:text-gray-700", children: "Disconnect" })] }));
    }
    return (_jsx(Button, { onClick: handleConnect, disabled: isConnecting, className: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white", children: isConnecting ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Connecting..."] })) : (_jsx(_Fragment, { children: "\uD83E\uDD8A Connect Wallet" })) }));
}
