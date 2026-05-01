import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout() {
  return (
    <Box className="layout" sx={{ display: 'flex', bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      <Sidebar />
      <Box className="main-content" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
