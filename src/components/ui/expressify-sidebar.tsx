"use client";

import React, { useState, useEffect } from "react";
import { memo } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mic,
  Phone,
  BarChart3,
  BookOpen,
  Users,
  Settings,
  Moon,
  Sun,
  User,
  SearchIcon,
  FolderIcon,
  FolderOpenIcon,
  MessageSquare,
  Video,
  Target,
  Trophy,
  Brain,
  Headphones,
  Database,
  Gamepad2,
  PhoneCall,
  Zap,
  Bot,
  UserPlus,
  HelpCircle,
  FileText,
  VolumeX,
  Eye,
  Users2,
  Swords,
  MessageCircle,
  ChevronDown,
  LogOut,
  HomeIcon,
  ScreenShareIcon,
  CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import HomePage from "@/app/me/home/page";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { isFeatureAccessible } from "@/lib/accessControl";

interface NavigationItem {
  name: string;
  href?: string;
  children?: string[];
  icon?: React.ComponentType<any>;
}

// Expressify-specific navigation structure
const navigationItems: Record<string, NavigationItem> = {
  home: {
    name: "Home",
    href: "/me/home",
    icon: HomeIcon,
  },
  "learning-path": {
    name: "Learning Path",
    href: "/me/learning-path",
    icon: Target,
  },
  pricing: {
    name: "Pricing",
    href: "/pricing",
    icon: CreditCard,
  },
  "clarity-cafe": {
    name: "Clarity Cafe",
    href: "/clarity-cafe",
    icon: HelpCircle,
  },
  history: {
    name: "History",
    href: "/me/history",
    icon: BarChart3,
  },
  training: {
    name: "Training Modules",
    children: [],
    icon: BookOpen,
  },
  "conversation-skills": {
    name: "Conversation Skills",
    children: ["active-listening", "small-talk", "networking"],
    icon: MessageSquare,
  },
  "active-listening": {
    name: "Active Listening",
    href: "/training/conversation/active-listening",
  },
  "small-talk": {
    name: "Small Talk Mastery",
    href: "/training/conversation/small-talk",
  },
  networking: {
    name: "Networking",
    href: "/training/conversation/networking",
  },
  "phone-calls": {
    name: "Phone Communication",
    children: ["basic-calls", "professional-calls", "cold-calling"],
    icon: Phone,
  },
  "basic-calls": {
    name: "Basic Phone Skills",
    href: "/training/phone/basic",
  },
  "professional-calls": {
    name: "Professional Calls",
    href: "/training/phone/professional",
  },
  "cold-calling": {
    name: "Cold Calling",
    href: "/training/phone/cold-calling",
  },
  "video-calls": {
    name: "Video Communication",
    children: ["video-basics", "virtual-meetings", "webinars"],
    icon: Video,
  },
  "video-basics": {
    name: "Video Call Basics",
    href: "/training/video/basics",
  },
  "virtual-meetings": {
    name: "Virtual Meetings",
    href: "/training/video/meetings",
  },
  webinars: {
    name: "Webinars",
    href: "/training/video/webinars",
  },
  presentation: {
    name: "Presentation Skills",
    children: ["storytelling", "public-speaking", "slide-design"],
    icon: Target,
  },
  storytelling: {
    name: "Storytelling",
    href: "/training/presentation/storytelling",
  },
  "public-speaking": {
    name: "Public Speaking",
    href: "/training/presentation/public-speaking",
  },
  "slide-design": {
    name: "Slide Design",
    href: "/training/presentation/slides",
  },
  "textual-practice": {
    name: "Textual Practice",
    href: "/learning/textual",
    icon: FileText,
  },
  "vocal-practice": {
    name: "Vocal Practice",
    href: "/learning/vocal",
    icon: Mic,
  },
  "visual-practice": {
    name: "Visual Practice",
    href: "/learning/visual",
    icon: ScreenShareIcon,
  },
  "play-with-friend": {
    name: "Play with Friend",
    children: ["collaborate", "challenge"],
    href: "/training/social",
    icon: Users2,
  },
  "collaborate": {
    name: "Collaborate",
    href: "/training/social/collaborate",
  },
  "challenge": {
    name: "Challenge",
    href: "/training/social/challenge",
    icon: Swords,
  },
  "vc-person": {
    name: "VC a Person",
    href: "/training/vc-person",
    icon: MessageCircle,
  },
  "ai-calling": {
    name: "AI Calling",
    href: "/training/ai-calling",
    children: ["general-call", "debate-call", "roleplay-call"],
    icon: Phone,
  },
  "general-call": {
    name: "General Call",
    href: "/training/ai-calling/general",
  },
  "debate-call": {
    name: "Debate Call",
    href: "/training/ai-calling/debate",
  },
  "roleplay-call": {
    name: "Role Play Call",
    href: "/training/ai-calling/roleplay",
  },
  progress: {
    name: "Progress & Analytics",
    children: ["dashboard", "achievements", "feedback"],
    icon: BarChart3,
  },
  dashboard: {
    name: "Dashboard",
    href: "/progress/dashboard",
  },
  achievements: {
    name: "Achievements",
    href: "/progress/achievements",
    icon: Trophy,
  },
  feedback: {
    name: "AI Feedback",
    href: "/progress/feedback",
    icon: Brain,
  },
  practice: {
    name: "Live Practice",
    href: "/practice",
    icon: Headphones,
  },
  community: {
    name: "Community",
    href: "/community",
    icon: Users,
  },
};

// Pricing Menu Button Component with Current Plan Display
const PricingMenuButton = ({ isCollapsed, user }: { isCollapsed: boolean; user: FirebaseUser | null }) => {
  const [currentPlan, setCurrentPlan] = useState<string>('freemium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = ref(database, `users/${user.uid}/subscription`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          setCurrentPlan(snapshot.val().plan);
        } else {
          setCurrentPlan('freemium');
        }
      } catch (error) {
        console.error('Error fetching current plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentPlan();
  }, [user]);

  const getPlanDisplay = (plan: string): string => {
    switch (plan) {
      case 'freemium':
        return 'Free';
      case 'student':
        return 'Student';
      case 'premium':
        return 'Premium';
      default:
        return 'Free';
    }
  };

  if (isCollapsed) {
    return (
      <SidebarMenuButton asChild>
        <Link href="/pricing" className="flex items-center justify-center">
          <CreditCard className="size-4" />
        </Link>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuButton asChild>
      <Link href="/pricing" className="flex items-center gap-2">
        <CreditCard className="size-4" />
        <div className="flex flex-col items-start flex-1">
          <span>Pricing</span>
          {user && !loading && (
            <span className="text-xs text-muted-foreground">
              {getPlanDisplay(currentPlan)} Plan
            </span>
          )}
        </div>
      </Link>
    </SidebarMenuButton>
  );
};

const ExpressifyTreeNavigation = () => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set() // Keep all trees closed by default
  );
  const [clickedItems, setClickedItems] = useState<Set<string>>(new Set());
  const [hoveredItems, setHoveredItems] = useState<Set<string>>(new Set());
  const [hoverExpandedItems, setHoverExpandedItems] = useState<Set<string>>(new Set());
  const [autoCloseTimers, setAutoCloseTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [userPlan, setUserPlan] = useState<string>('freemium');
  const { state } = useSidebar();
  const { user } = useAuth();
  const isCollapsed = state === "collapsed";

  // Fetch user plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;

      try {
        const userRef = ref(database, `users/${user.uid}/subscription`);
        const snapshot = await get(userRef);
        setUserPlan(snapshot.exists() ? snapshot.val().plan : 'freemium');
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };

    fetchUserPlan();
  }, [user]);

  // Define the main navigation items (direct children) - filtered by plan
  const allMainNavItems = [
    "home",
    "history",
    "textual-practice", 
    "vocal-practice", 
    "visual-practice",
    "learning-path",
    "play-with-friend",
    "ai-calling",
    "vc-person",
    "clarity-cafe"
  ];

  // Filter navigation items based on user's plan
  const mainNavItems = allMainNavItems.filter(itemId => 
    isFeatureAccessible(itemId, userPlan)
  );

  // Cleanup function to clear all timers
  const clearAllTimers = () => {
    autoCloseTimers.forEach(timer => clearTimeout(timer));
    setAutoCloseTimers(new Map());
  };

  // Clear timers when collapsed state changes
  React.useEffect(() => {
    if (isCollapsed) {
      clearAllTimers();
      setHoverExpandedItems(new Set());
      setHoveredItems(new Set());
    }
  }, [isCollapsed]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const toggleExpanded = (itemId: string) => {
    // Clear any existing auto-close timer for this item
    const timer = autoCloseTimers.get(itemId);
    if (timer) {
      clearTimeout(timer);
      setAutoCloseTimers(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    }
    
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        // Also remove from hover-expanded when clicking to collapse
        setHoverExpandedItems(hPrev => {
          const hNewSet = new Set(hPrev);
          hNewSet.delete(itemId);
          return hNewSet;
        });
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleClicked = (itemId: string) => {
    setClickedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleMouseEnter = (itemId: string) => {
    if (isCollapsed) return; // No hover in collapsed mode
    setHoveredItems(prev => new Set([...prev, itemId]));
    
    // Clear any existing auto-close timer for this item
    const timers = autoCloseTimers.get(itemId);
    if (timers) {
      clearTimeout(timers);
      setAutoCloseTimers(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    }
    
    // Add to hover-expanded if not already expanded by click
    if (!expandedItems.has(itemId)) {
      setHoverExpandedItems(prev => new Set([...prev, itemId]));
    }
  };

  const handleMouseLeave = (itemId: string) => {
    if (isCollapsed) return; // No hover in collapsed mode
    // Use setTimeout to allow user to move to children
    setTimeout(() => {
      setHoveredItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      // Set auto-close timer for hover-expanded items only if still hover-expanded
      if (hoverExpandedItems.has(itemId) && !expandedItems.has(itemId)) {
        // Clear any existing timer for this item first
        const existingTimer = autoCloseTimers.get(itemId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        const timer = setTimeout(() => {
          // Double-check the item is still in hover-expanded state
          setHoverExpandedItems(prev => {
            if (prev.has(itemId)) {
              const newSet = new Set(prev);
              newSet.delete(itemId);
              return newSet;
            }
            return prev;
          });
          
          setAutoCloseTimers(prev => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            return newMap;
          });
        }, 2500); // 2.5 second auto-close
        
        setAutoCloseTimers(prev => {
          const newMap = new Map(prev);
          newMap.set(itemId, timer);
          return newMap;
        });
      }
    }, 200); // 200ms delay
  };

  const handleContainerMouseEnter = (itemId: string) => {
    if (isCollapsed) return;
    setHoveredItems(prev => new Set([...prev, itemId]));
    
    // Clear any existing auto-close timer for this item
    const timers = autoCloseTimers.get(itemId);
    if (timers) {
      clearTimeout(timers);
      setAutoCloseTimers(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    }
    
    // Add to hover-expanded if not already expanded by click
    if (!expandedItems.has(itemId)) {
      setHoverExpandedItems(prev => new Set([...prev, itemId]));
    }
  };

  const handleContainerMouseLeave = (itemId: string) => {
    if (isCollapsed) return;
    setTimeout(() => {
      setHoveredItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      // Set auto-close timer for hover-expanded items only if still hover-expanded
      if (hoverExpandedItems.has(itemId) && !expandedItems.has(itemId)) {
        // Clear any existing timer for this item first
        const existingTimer = autoCloseTimers.get(itemId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        const timer = setTimeout(() => {
          // Double-check the item is still in hover-expanded state
          setHoverExpandedItems(prev => {
            if (prev.has(itemId)) {
              const newSet = new Set(prev);
              newSet.delete(itemId);
              return newSet;
            }
            return prev;
          });
          
          setAutoCloseTimers(prev => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            return newMap;
          });
        }, 6000); // 3 second auto-close for container
        
        setAutoCloseTimers(prev => {
          const newMap = new Map(prev);
          newMap.set(itemId, timer);
          return newMap;
        });
      }
    }, 200);
  };

  const renderNavItem = (itemId: string, level: number = 0): React.ReactNode => {
    const item = navigationItems[itemId];
    if (!item) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(itemId) || hoverExpandedItems.has(itemId) || hoveredItems.has(itemId);
    const isClicked = clickedItems.has(itemId);
    const Icon = item.icon;
    const paddingLeft = level * 16;

    // Filter items based on search
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      // Check if any children match
      const hasMatchingChildren = item.children?.some(childId => 
        navigationItems[childId]?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (!hasMatchingChildren) return null;
    }

    // Don't show child items in collapsed mode
    if (isCollapsed && level > 0) {
      return null;
    }

    return (
      <div 
        key={itemId}
        onMouseEnter={() => hasChildren && handleContainerMouseEnter(itemId)}
        onMouseLeave={() => hasChildren && handleContainerMouseLeave(itemId)}
      >
        <div 
          className={`flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer transition-colors ${
            isClicked && hasChildren ? 'bg-accent/70' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onMouseEnter={() => hasChildren && handleMouseEnter(itemId)}
          onMouseLeave={() => hasChildren && handleMouseLeave(itemId)}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(itemId);
              toggleClicked(itemId);
            }
          }}
        >
          {!isCollapsed && (
            <ChevronDown 
              className={`size-4 text-muted-foreground ${
                hasChildren 
                  ? `transition-transform cursor-pointer ${isExpanded ? "" : "-rotate-90"}` 
                  : "-rotate-90 pointer-events-none"
              }`}
            />
          )}
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {!isCollapsed && (
            item.href ? (
              <Link 
                href={item.href} 
                className="flex-1 text-sm hover:text-primary transition-colors"
                onClick={(e) => {
                  // Don't stop propagation for parent items with children
                  // This allows both navigation and dropdown toggle
                  if (!hasChildren) {
                    e.stopPropagation();
                  }
                }}
              >
                {item.name}
              </Link>
            ) : (
              <span className="flex-1 text-sm font-medium">{item.name}</span>
            )
          )}
        </div>
        
        {hasChildren && isExpanded && !isCollapsed && (
          <div>
            {item.children!.map(childId => renderNavItem(childId, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {isCollapsed ? (
        // Collapsed mode: only show search icon
        <div className="flex justify-center p-2">
          <SearchIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        // Expanded mode: show full search input
        <div className="relative">
          <Input
            className="peer ps-9 h-8"
            type="search"
            placeholder="Search training..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Expand all when searching
              if (e.target.value.length > 0) {
                setExpandedItems(new Set(Object.keys(navigationItems)));
              } else {
                setExpandedItems(new Set()); // Keep all trees closed by default
              }
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
            <SearchIcon className="size-3" aria-hidden="true" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          // Collapsed mode - show icons with tooltips
          <TooltipProvider>
            {mainNavItems.map(itemId => {
              const item = navigationItems[itemId];
              const Icon = item?.icon;
              if (!item || !Icon) return null;
              
              return (
                <div key={itemId} className="flex justify-center mb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {item.href ? (
                        <Link 
                          href={item.href}
                          className="flex items-center justify-center w-8 h-8 rounded-sm hover:bg-accent cursor-pointer transition-colors group"
                        >
                          <Icon className="size-4 text-muted-foreground group-hover:text-foreground" />
                        </Link>
                      ) : (
                        <div 
                          className="flex items-center justify-center w-8 h-8 rounded-sm hover:bg-accent cursor-pointer transition-colors group"
                        >
                          <Icon className="size-4 text-muted-foreground group-hover:text-foreground" />
                        </div>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </TooltipProvider>
        ) : (
          // Expanded mode - show full tree
          mainNavItems.map(itemId => renderNavItem(itemId))
        )}
      </div>
    </div>
  );
};

interface ExpressifySidebarProps {
  hideDarkModeToggle?: boolean;
}

export const ExpressifySidebar = memo(({ hideDarkModeToggle = false }: ExpressifySidebarProps) => {
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isCollapsed = state === "collapsed";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    // Force update localStorage to prevent revert
    if (typeof window !== 'undefined') {
      localStorage.setItem('expressify-theme', newTheme);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/me/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-background">
                  <Image 
                    src="/logo.png" 
                    alt="Expressify Logo" 
                    width={32} 
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Expressify</span>
                  <span className="truncate text-xs">Communication Training</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Training Navigation Tree */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <ExpressifyTreeNavigation />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Pricing Link with Current Plan */}
          <SidebarMenuItem>
            <PricingMenuButton isCollapsed={isCollapsed} user={user} />
          </SidebarMenuItem>
          
          {!hideDarkModeToggle && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleThemeToggle}
              >
                {mounted ? (theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />) : <div className="size-4" />}
                <span>{mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Theme"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar}>
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              <span>Toggle Sidebar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {isCollapsed ? (
              // Collapsed mode - use simpler structure
              user ? (
                <SidebarMenuButton asChild>
                  <Link href="/me/account" className="flex items-center justify-center p-0">
                    <UserAvatar 
                      user={user} 
                      size="sm" 
                      showTooltip={isCollapsed}
                      className="!w-6 !h-6 !min-w-[24px] !min-h-[24px] !max-w-[24px] !max-h-[24px]"
                    />
                  </Link>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild>
                  <Link href="/landing" className="flex items-center justify-center">
                    <User className="size-4" />
                  </Link>
                </SidebarMenuButton>
              )
            ) : (
              // Expanded mode - full layout
              user ? (
                <SidebarMenuButton asChild>
                  <Link href="/me/account" className="flex items-center gap-2 py-2">
                    <UserAvatar 
                      user={user} 
                      size="sm" 
                      showTooltip={false}
                      className="flex-shrink-0"
                    />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-sm font-medium truncate max-w-full">
                        {user.displayName || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-full">
                        {user.email}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild>
                  <Link href="/landing" className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>Sign in</span>
                  </Link>
                </SidebarMenuButton>
              )
            )}
          </SidebarMenuItem>
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
});

ExpressifySidebar.displayName = "ExpressifySidebar";