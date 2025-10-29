"use client";

import React, { useState } from "react";
import { memo } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import Link from "next/link";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
    icon: Mic,
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
    children: ["word-puzzles", "story-builder", "chat-simulator", "debate-master", "vocabulary-quest", "grammar-challenge"],
    icon: FileText,
  },
  "word-puzzles": {
    name: "Word Puzzles",
    href: "/training/textual/word-puzzles",
  },
  "story-builder": {
    name: "Story Builder",
    href: "/training/textual/story-builder",
  },
  "chat-simulator": {
    name: "Chat Simulator",
    href: "/training/textual/chat-simulator",
  },
  "debate-master": {
    name: "Debate Master",
    href: "/training/textual/debate-master",
  },
  "vocabulary-quest": {
    name: "Vocabulary Quest",
    href: "/training/textual/vocabulary-quest",
  },
  "grammar-challenge": {
    name: "Grammar Challenge",
    href: "/training/textual/grammar-challenge",
  },
  "vocal-practice": {
    name: "Vocal Practice",
    children: ["pronunciation-pro", "accent-trainer", "voice-modulation", "speaking-rhythm", "vocal-warm-ups", "clarity-coach"],
    icon: VolumeX,
  },
  "pronunciation-pro": {
    name: "Pronunciation Pro",
    href: "/training/vocal/pronunciation-pro",
  },
  "accent-trainer": {
    name: "Accent Trainer",
    href: "/training/vocal/accent-trainer",
  },
  "voice-modulation": {
    name: "Voice Modulation",
    href: "/training/vocal/voice-modulation",
  },
  "speaking-rhythm": {
    name: "Speaking Rhythm",
    href: "/training/vocal/speaking-rhythm",
  },
  "vocal-warm-ups": {
    name: "Vocal Warm-ups",
    href: "/training/vocal/vocal-warm-ups",
  },
  "clarity-coach": {
    name: "Clarity Coach",
    href: "/training/vocal/clarity-coach",
  },
  "visual-practice": {
    name: "Visual Practice",
    children: ["body-language-lab", "gesture-guide", "presentation-posture"],
    icon: Eye,
  },
  "body-language-lab": {
    name: "Body Language Lab",
    href: "/training/visual/body-language-lab",
  },
  "gesture-guide": {
    name: "Gesture Guide",
    href: "/training/visual/gesture-guide",
  },
  "presentation-posture": {
    name: "Presentation Posture",
    href: "/training/visual/presentation-posture",
  },
  "play-with-friend": {
    name: "Play with Friend",
    children: ["collaborate", "challenge"],
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

const ExpressifyTreeNavigation = () => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set() // Keep all trees closed by default
  );
  const [clickedItems, setClickedItems] = useState<Set<string>>(new Set());
  const [hoveredItems, setHoveredItems] = useState<Set<string>>(new Set());
  const [hoverExpandedItems, setHoverExpandedItems] = useState<Set<string>>(new Set());
  const [autoCloseTimers, setAutoCloseTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Define the main navigation items (direct children)
  const mainNavItems = [
    "textual-practice", 
    "vocal-practice", 
    "visual-practice", 
    "play-with-friend", 
    "vc-person"
  ];

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
      
      // Set auto-close timer for hover-expanded items (6 seconds)
      if (hoverExpandedItems.has(itemId) && !expandedItems.has(itemId)) {
        const timer = setTimeout(() => {
          setHoverExpandedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
          setAutoCloseTimers(prev => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            return newMap;
          });
        }, 2500); // 1 second auto-close
        
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
      
      // Set auto-close timer for hover-expanded items (6 seconds)
      if (hoverExpandedItems.has(itemId) && !expandedItems.has(itemId)) {
        const timer = setTimeout(() => {
          setHoverExpandedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
          setAutoCloseTimers(prev => {
            const newMap = new Map(prev);
            newMap.delete(itemId);
            return newMap;
          });
        }, 6000); // 6 seconds auto-close
        
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
          {hasChildren && !isCollapsed && (
            <ChevronDown 
              className={`size-4 text-muted-foreground transition-transform ${
                isExpanded ? "" : "-rotate-90"
              }`}
            />
          )}
          {!hasChildren && !isCollapsed && <div className="w-4" />}
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {!isCollapsed && (
            item.href ? (
              <Link 
                href={item.href} 
                className="flex-1 text-sm hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
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
                      <div 
                        className="flex items-center justify-center w-8 h-8 rounded-sm hover:bg-accent cursor-pointer transition-colors group"
                      >
                        <Icon className="size-4 text-muted-foreground group-hover:text-foreground" />
                      </div>
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

export const ExpressifySidebar = memo(() => {
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const { state } = useSidebar();
  const router = useRouter();

  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/start');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/me/home">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Mic className="h-5 w-5" />
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
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/profile" className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <UserAvatar 
                  user={user} 
                  size="md" 
                  showTooltip={isCollapsed}
                />
                {!isCollapsed && user && (
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate">
                      {user.displayName || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
});

ExpressifySidebar.displayName = "ExpressifySidebar";