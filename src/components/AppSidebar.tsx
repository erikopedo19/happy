import { Calendar, Users, Settings, Home, Package, LogOut, Scissors, Globe, UserCheck, Briefcase, Mail } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrgSwitcher } from "@/components/OrgSwitcher";

const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: Calendar,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: Briefcase,
  },
  {
    title: "Services",
    url: "/services",
    icon: Scissors,
  },
  {
    title: "Booking",
    url: "/booking-page",
    icon: Globe,
  },
  {
    title: "Stylists",
    url: "/stylists",
    icon: UserCheck,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Teams",
    url: "/teams",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const settingsItems = []; // Emptying this as Settings is moved to mainItems, or we can keep it if we want a separate section but the user asked for specific list order.
// Actually, the user said "add teh pages dashboard agenda services booking page stylists teams settings and nder stylists products"
// It implies a single list or specific grouping. I will put them all in mainItems for now to match the list order requested.


export function AppSidebar() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const sidebar = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    : "SC";

  const userName = user?.user_metadata?.full_name || "Barber Shop";

  const renderMenuGroup = (title: string, items: typeof mainItems) => (
    <SidebarGroup className="mb-2">
      {sidebar.state !== "collapsed" && title && (
        <div className="px-3 mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={`
                    group relative w-full justify-start px-3 py-2.5 rounded-xl transition-all duration-200 
                    ${isActive
                      ? 'bg-sidebar-ring text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }
                  `}
                >
                  <Link to={item.url} className="flex items-center gap-3 w-full">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                    {sidebar.state !== "collapsed" && (
                      <span className="text-sm font-medium truncate">
                        {item.title}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      className="bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out"
      collapsible="icon"
    >
      <SidebarHeader className="p-2 border-b border-sidebar-border">
        <OrgSwitcher collapsed={sidebar.state === "collapsed"} />
        {isMobile && <SidebarTrigger className="lg:hidden mt-2" />}
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-2">
        {renderMenuGroup("Menu", mainItems)}
        {renderMenuGroup("System", settingsItems)}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {sidebar.state !== "collapsed" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/30 border border-blue-100">
              <Avatar className="h-10 w-10 border-2 border-blue-100">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm text-gray-900 truncate">{userName}</p>
                {user?.email && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Avatar className="h-8 w-8 mx-auto border border-blue-100">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

