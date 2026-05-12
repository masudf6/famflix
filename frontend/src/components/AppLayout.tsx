import { ReactNode, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/PersonOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/context/ChatContext";
import { tokens } from "@/theme";

interface Props {
  children: ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  badge?: number;
  hidden?: boolean;
}

export const AppLayout = ({ children }: Props) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const displayName =
    user?.display_name || user?.full_name || user?.email.split("@")[0] || "";
  const avatarChar = (displayName || user?.email || "?")[0].toUpperCase();

  const navItems: NavItem[] = [
    { to: "/", label: "Home" },
    { to: "/#movies", label: "Movies" },
    { to: "/#tv", label: "TV" },
    { to: "/#my-list", label: "My List" },
    { to: "/chat", label: "Chat", badge: unreadCount },
    { to: "/upload", label: "Upload", hidden: !isAdmin },
  ].filter((item) => !item.hidden);

  const isActive = (to: string) => {
    const [path, hash] = to.split("#");
    if (path === "/chat") return location.pathname.startsWith("/chat");
    if (hash) {
      return location.pathname === path && location.hash === `#${hash}`;
    }
    return location.pathname === path && !location.hash;
  };

  const NavLink = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const active = isActive(item.to);
    return (
      <Box
        component={RouterLink}
        to={item.to}
        onClick={onClick}
        sx={{
          position: "relative",
          textDecoration: "none",
          color: active ? "primary.main" : "text.primary",
          opacity: active ? 1 : 0.82,
          fontSize: 14,
          fontWeight: active ? 700 : 600,
          px: 1.35,
          py: { xs: 1.4, md: 0.85 },
          borderRadius: 2,
          transition: "color .16s ease, opacity .16s ease, background .16s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: 0.85,
          "&:hover": {
            color: "primary.main",
            opacity: 1,
            background: { md: tokens.hoverSubtle },
          },
        }}
      >
        {item.label}
        {!!item.badge && item.badge > 0 && (
          <Box
            sx={{
              minWidth: 18,
              height: 18,
              px: 0.6,
              borderRadius: 99,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontSize: 10,
              fontWeight: 800,
              display: "grid",
              placeItems: "center",
            }}
          >
            {item.badge > 99 ? "99+" : item.badge}
          </Box>
        )}
        {active && isDesktop && (
          <Box
            sx={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: -13,
              height: 2,
              borderRadius: 99,
              bgcolor: "primary.main",
              boxShadow: `0 0 18px ${tokens.accent}`,
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="default">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 62, md: 72 }, gap: 2 }}>
            <Box
              onClick={() => navigate("/")}
              sx={{
                flex: { md: 1 },
                minWidth: { md: 180 },
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: 22, md: 24 },
                  letterSpacing: "-0.04em",
                  color: "primary.main",
                  lineHeight: 1,
                }}
              >
                FamFlix
              </Typography>
            </Box>

            {isDesktop ? (
              <>
                <Stack direction="row" justifyContent="center" sx={{ flex: 2, gap: 1.4 }}>
                  {navItems.map((item) => (
                    <NavLink key={item.to} item={item} />
                  ))}
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="center"
                  spacing={1.2}
                  sx={{ flex: 1, minWidth: 180 }}
                >
                  <IconButton size="small" onClick={() => navigate("/?search=1")}>
                    <SearchIcon />
                  </IconButton>

                  {user && (
                    <>
                      <IconButton
                        size="small"
                        onClick={(e) => setMenuEl(e.currentTarget)}
                        sx={{ p: 0.25, gap: 0.75 }}
                      >
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            background: `linear-gradient(135deg, ${tokens.accent} 0%, ${tokens.accentDeep} 100%)`,
                            color: "primary.contrastText",
                            fontSize: 14,
                            border: `2px solid ${tokens.accent}`,
                          }}
                        >
                          {avatarChar}
                        </Avatar>
                        <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                      <Menu
                        anchorEl={menuEl}
                        open={!!menuEl}
                        onClose={() => setMenuEl(null)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        slotProps={{ paper: { sx: { mt: 1, minWidth: 220, p: 0.5 } } }}
                      >
                        <Box sx={{ px: 1.8, py: 1.4 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {user.email}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <MenuItem
                          onClick={() => {
                            setMenuEl(null);
                            navigate("/profile");
                          }}
                        >
                          <PersonIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                          Profile
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            setMenuEl(null);
                            navigate("/profile?tab=settings");
                          }}
                        >
                          <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                          Settings
                        </MenuItem>
                        <Divider sx={{ my: 0.5 }} />
                        <MenuItem
                          onClick={() => {
                            setMenuEl(null);
                            logout();
                            navigate("/login");
                          }}
                        >
                          <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                          Logout
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </Stack>
              </>
            ) : (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: "auto" }}>
                <IconButton size="small" onClick={() => navigate("/?search=1")}>
                  <SearchIcon />
                </IconButton>
                <IconButton size="small" onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            background: tokens.surfaceRaised,
            borderLeft: `1px solid ${tokens.rule}`,
          },
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ flex: 1, fontWeight: 800, color: "primary.main", letterSpacing: "-.03em" }}>
            FamFlix
          </Typography>
          <IconButton size="small" onClick={() => setDrawerOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider />

        <Stack spacing={0.5} sx={{ p: 1.25 }}>
          {navItems.map((item) => (
            <NavLink key={item.to} item={item} onClick={() => setDrawerOpen(false)} />
          ))}
        </Stack>

        <Divider sx={{ my: 1 }} />
        {user && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: `linear-gradient(135deg, ${tokens.accent} 0%, ${tokens.accentDeep} 100%)`,
                  color: "primary.contrastText",
                }}
              >
                {avatarChar}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700 }} noWrap>
                  {displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={0.75}>
              <MenuItem
                onClick={() => {
                  setDrawerOpen(false);
                  navigate("/profile");
                }}
              >
                <PersonIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setDrawerOpen(false);
                  navigate("/profile?tab=settings");
                }}
              >
                <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                Settings
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                  navigate("/login");
                }}
              >
                <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                Logout
              </MenuItem>
            </Stack>
          </Box>
        )}
      </Drawer>

      <Box component="main">{children}</Box>
    </Box>
  );
};
