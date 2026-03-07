import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navbar } from '@/components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
function App() {
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50", children: [_jsx(Navbar, {}), _jsx(Dashboard, {})] }));
}
export default App;
