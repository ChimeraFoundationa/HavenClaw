import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { WalletConnect } from '@/components/wallet/WalletConnect';
export function Navbar() {
    return (_jsx("nav", { className: "sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md", children: _jsx("div", { className: "container mx-auto px-4", children: _jsxs("div", { className: "flex h-16 items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: "\uD83C\uDFDB\uFE0F" }), _jsx("span", { className: "text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent", children: "HavenClaw Dashboard" })] }), _jsx("div", { children: _jsx(WalletConnect, {}) })] }) }) }));
}
