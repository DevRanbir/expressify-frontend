"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ExpressifySidebar } from "@/components/ui/expressify-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Play, Info, Clock, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getGameConfig } from "@/config/textualGames";

export default function TextualGameStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("game");
  
  const [difficulty, setDifficulty] = useState(1);
  const [timeDuration, setTimeDuration] = useState(10); // in minutes (5, 10, 15, 20)
  const [showInstructions, setShowInstructions] = useState(false);
  const [openedTabs, setOpenedTabs] = useState<Set<string>>(new Set());
  const [gameConfig, setGameConfig] = useState<ReturnType<typeof getGameConfig>>(null);

  useEffect(() => {
    if (!gameId) {
      router.push("/learning/textual");
      return;
    }

    const config = getGameConfig(gameId);
    if (!config) {
      router.push("/learning/textual");
      return;
    }

    setGameConfig(config);
    // Set default difficulty to middle value
    setDifficulty(Math.ceil(config.difficultyLevels.length / 2));
  }, [gameId, router]);

  if (!gameConfig) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const selectedDifficulty = gameConfig.difficultyLevels[difficulty - 1];
  const IconComponent = gameConfig.icon;

  const handleStartGame = () => {
    // Check if all tabs have been opened
    if (openedTabs.size < 3) {
      setShowInstructions(true);
      return;
    }

    // All tabs opened, proceed to game
    proceedToGame();
  };

  const proceedToGame = () => {
    // Store difficulty, time duration, and game ID in sessionStorage for game page
    sessionStorage.setItem("textual_game_difficulty", difficulty.toString());
    sessionStorage.setItem("textual_game_duration", timeDuration.toString());
    sessionStorage.setItem("textual_game_id", gameConfig.id);
    router.push(gameConfig.gameRoute);
  };

  const handleAccordionChange = (value: string) => {
    if (value) {
      setOpenedTabs(prev => new Set([...prev, value]));
    }
  };

  const handleDialogClose = () => {
    setShowInstructions(false);
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          {/* Header */}
          <header className="bg-background/95 sticky top-0 z-50 flex h-16 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/me/home">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/learning/textual">Textual Training</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{gameConfig.name} Setup</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2 px-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
                {/* Page Header with Start Button */}
                <div className="px-2 sm:px-0 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
                      <IconComponent className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                      {gameConfig.name} Setup
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      Configure your game settings and start playing
                    </p>
                  </div>
                  <Button size="lg" onClick={handleStartGame}>
                    <Play className="mr-2 h-5 w-5" />
                    Start Game
                  </Button>
                </div>


                {/* Game Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      About {gameConfig.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground">
                      {gameConfig.longDescription}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {gameConfig.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Game Settings - Side by Side Layout */}
                <Card>
                  <CardHeader>
                    <CardTitle>Game Settings</CardTitle>
                    <CardDescription>
                      Configure difficulty and time duration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 md:min-h-[280px]">
                      {/* Difficulty Selection - Left Side */}
                      <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Difficulty Level</Label>
                            <Badge className={selectedDifficulty.color} variant="outline">
                              {selectedDifficulty.label}
                            </Badge>
                          </div>
                          
                          <Slider
                            value={[difficulty]}
                            onValueChange={(value) => setDifficulty(value[0])}
                            min={1}
                            max={gameConfig.difficultyLevels.length}
                            step={1}
                            className="w-full"
                          />

                          <div className="flex justify-between text-xs text-muted-foreground">
                            {gameConfig.difficultyLevels.map((level) => (
                              <span key={level.value} className={difficulty === level.value ? "font-bold text-foreground" : ""}>
                                {level.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border bg-muted/50 p-4">
                          <p className="text-sm font-medium mb-1">{selectedDifficulty.label} Settings:</p>
                          <p className="text-sm text-muted-foreground">{selectedDifficulty.description}</p>
                        </div>
                      </div>

                      {/* Vertical Divider - Hidden on mobile */}
                      <div className="hidden md:block w-px bg-border"></div>

                      {/* Time Duration Selection - Right Side with Clickable Text */}
                      <div className="flex flex-col items-center justify-center space-y-6 md:w-48">
                        <div className="text-center">
                          <Label className="text-base font-semibold">Time Limit</Label>
                        </div>

                        <div className="flex flex-col gap-4 w-full items-center">
                          {[5, 10, 15, 20].map((time) => (
                            <button
                              key={time}
                              onClick={() => setTimeDuration(time)}
                              className={`
                                transition-all cursor-pointer text-center py-1
                                ${timeDuration === time 
                                  ? "text-primary font-bold text-2xl scale-110" 
                                  : "text-muted-foreground hover:text-foreground hover:scale-105 text-xl"
                                }
                              `}
                            >
                              {time} min
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Info className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Read Instructions Before Starting
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Please open and read all sections below to continue
            </DialogDescription>
          </DialogHeader>
          
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-2"
            onValueChange={handleAccordionChange}
          >
            <AccordionItem
              value="rules"
              className="rounded border bg-background px-3 sm:px-4 py-1 outline-none has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
            >
              <AccordionTrigger className="py-2 text-sm sm:text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                 Game Rules
              </AccordionTrigger>
              <AccordionContent className="pb-2 text-xs sm:text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  {gameConfig.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="scoring"
              className="rounded border bg-background px-3 sm:px-4 py-1 outline-none has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
            >
              <AccordionTrigger className="py-2 text-sm sm:text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                 {gameConfig.scoring.title}
              </AccordionTrigger>
              <AccordionContent className="pb-2 text-xs sm:text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  {gameConfig.scoring.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="settings"
              className="rounded border bg-background px-3 sm:px-4 py-1 outline-none has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 !border-b"
            >
              <AccordionTrigger className="py-2 text-sm sm:text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                 Your Settings
              </AccordionTrigger>
              <AccordionContent className="pb-2 text-xs sm:text-sm space-y-2">
                <p className="text-foreground">
                  <strong>Selected Difficulty:</strong> {selectedDifficulty.label}
                </p>
                <p className="text-foreground">
                  <strong>Game Duration:</strong> {timeDuration} minutes
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-5">
            <Button
              variant="outline"
              onClick={handleDialogClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={proceedToGame}
              disabled={openedTabs.size < 3}
              className="w-full sm:w-auto"
            >
              {openedTabs.size < 3 
                ? `Open all sections (${openedTabs.size}/3)` 
                : "Start Playing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
