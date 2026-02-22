import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Dumbbell, CalendarClock, Bot, LogOut, LayoutDashboard, Sun, Moon, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, gradient: "gradient-health" },
  { path: "/workouts", label: "Workouts", icon: Dumbbell, gradient: "gradient-workout" },
  { path: "/routines", label: "Routines", icon: CalendarClock, gradient: "gradient-routine" },
  { path: "/ai-coach", label: "AI Coach", icon: Bot, gradient: "gradient-ai" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userEmail = user?.email || "";
  const userInitial = userEmail.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated mesh background */}
      <div className="app-bg">
        <div className="app-bg-orb" />
        <div className="app-bg-orb" />
        <div className="app-bg-orb" />
        <div className="app-bg-grid" />
      </div>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg gradient-health">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-gradient-hero">VitalFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className="relative">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={cn("absolute inset-0 rounded-lg opacity-15", item.gradient)}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs gradient-health text-primary-foreground">{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm text-muted-foreground truncate max-w-[140px]">{userEmail}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{userEmail}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-b-0 px-2 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-1 p-2">
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobileTab"
                    className={cn("absolute inset-0 rounded-lg opacity-15", item.gradient)}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
