"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ExpressifySidebar } from "@/components/ui/expressify-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle,
  Search,
  ChevronDown,
  MessageCircle,
  Mail,
  Phone,
  Coffee,
  BookOpen,
  Video,
  Mic,
  Users,
  Settings
} from "lucide-react";
import { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqCategories = [
  { id: "getting-started", name: "Getting Started", icon: Coffee },
  { id: "training", name: "Training Modules", icon: BookOpen },
  { id: "ai-features", name: "AI Features", icon: Mic },
  { id: "collaboration", name: "Collaboration", icon: Users },
  { id: "technical", name: "Technical Support", icon: Settings },
];

const faqs: FAQItem[] = [
  {
    id: "1",
    question: "How do I get started with Expressify?",
    answer: "Start by completing your profile setup, then explore the three main training tracks: Textual, Vocal, and Visual. We recommend beginners start with Textual Practice to build foundational skills.",
    category: "getting-started"
  },
  {
    id: "2",
    question: "What are the three training types?",
    answer: "Textual Practice focuses on written communication and vocabulary building. Vocal Practice helps you develop speaking confidence through AI conversations. Visual Practice teaches body language and presentation skills.",
    category: "getting-started"
  },
  {
    id: "3",
    question: "How does AI Calling work?",
    answer: "AI Calling uses advanced speech recognition to simulate real phone conversations. You'll receive a phone number to call, and our AI will engage you in natural dialogue, providing feedback on your communication skills.",
    category: "ai-features"
  },
  {
    id: "4",
    question: "Can I practice with friends?",
    answer: "Yes! Use the 'Play with Friend' feature to join collaborative games like Sentence Builder or challenge friends in communication exercises. Simply create a game room and share the code.",
    category: "collaboration"
  },
  {
    id: "5",
    question: "What is the Learning Path feature?",
    answer: "Learning Path is your personalized roadmap through Expressify. It tracks your progress across different skill levels (Foundation, Confidence, Presence, Strategy) and unlocks new content as you advance.",
    category: "training"
  },
  {
    id: "6",
    question: "How do I track my progress?",
    answer: "Visit your Home dashboard to see your daily streak, total XP, and recent activities. The History page provides detailed analytics of your training sessions and improvements over time.",
    category: "training"
  },
  {
    id: "7",
    question: "Is my data secure?",
    answer: "Absolutely. We use Firebase authentication and encryption to protect your data. Your voice recordings are processed securely and never shared without your consent.",
    category: "technical"
  },
  {
    id: "8",
    question: "Can I use Expressify on mobile?",
    answer: "Yes! Expressify is a Progressive Web App (PWA) that works seamlessly on mobile browsers. You can also add it to your home screen for a native app experience.",
    category: "technical"
  },
  {
    id: "9",
    question: "How does the AI provide feedback?",
    answer: "Our AI analyzes your tone, pacing, vocabulary, and conversation flow. After each session, you'll receive personalized feedback with specific suggestions for improvement.",
    category: "ai-features"
  },
  {
    id: "10",
    question: "What if I'm too nervous to start?",
    answer: "That's completely normal! Start with text-based exercises in Textual Practice to build confidence at your own pace. There's no pressure - the platform adapts to your comfort level.",
    category: "getting-started"
  },
  {
    id: "11",
    question: "How do collaborative games work?",
    answer: "Collaborative games sync in real-time using Firebase. You can see other players' cursors, work together to solve challenges, and communicate via the built-in chat feature.",
    category: "collaboration"
  },
  {
    id: "12",
    question: "Can I practice specific scenarios?",
    answer: "Yes! Use the Role Play Call feature in AI Calling to practice job interviews, networking events, customer service calls, or any specific communication scenario you need to prepare for.",
    category: "ai-features"
  }
];

export default function ClarityCafePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <ExpressifySidebar />
          <SidebarInset className="flex-1 overflow-auto">
            <div className="min-h-screen bg-background">
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex flex-1 flex-col gap-2 p-4 sm:gap-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
                        <Coffee className="h-8 w-8 text-primary" />
                        Clarity Cafe
                      </h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Your friendly help desk - find answers and get support
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                  
                  {/* Search Bar */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search for help... (e.g., 'How do I start?')"
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Topics
                    </Button>
                    {faqCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <Icon className="h-3 w-3 mr-2" />
                          {category.name}
                        </Button>
                      );
                    })}
                  </div>

                  {/* FAQ List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">
                        {selectedCategory 
                          ? faqCategories.find(c => c.id === selectedCategory)?.name 
                          : "Frequently Asked Questions"}
                      </h2>
                      <Badge variant="outline">
                        {filteredFAQs.length} {filteredFAQs.length === 1 ? "question" : "questions"}
                      </Badge>
                    </div>

                    {filteredFAQs.length === 0 ? (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No results found</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Try adjusting your search or browse all categories
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedCategory(null);
                            }}
                          >
                            Clear filters
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {filteredFAQs.map((faq) => (
                          <Card 
                            key={faq.id}
                            className="transition-all hover:shadow-md cursor-pointer"
                            onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start gap-3">
                                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-sm sm:text-base mb-2">
                                        {faq.question}
                                      </h3>
                                      {expandedFAQ === faq.id && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                          {faq.answer}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <ChevronDown 
                                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                                    expandedFAQ === faq.id ? "rotate-180" : ""
                                  }`}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contact Support */}
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Still need help?
                      </CardTitle>
                      <CardDescription>
                        Our support team is here to assist you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button variant="outline" className="justify-start h-auto py-4">
                          <div className="flex flex-col items-start gap-2 text-left">
                            <Mail className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-semibold text-sm">Email Support</p>
                              <p className="text-xs text-muted-foreground">help@expressify.com</p>
                            </div>
                          </div>
                        </Button>
                        <Button variant="outline" className="justify-start h-auto py-4">
                          <div className="flex flex-col items-start gap-2 text-left">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-semibold text-sm">Live Chat</p>
                              <p className="text-xs text-muted-foreground">Available 9AM-5PM</p>
                            </div>
                          </div>
                        </Button>
                        <Button variant="outline" className="justify-start h-auto py-4">
                          <div className="flex flex-col items-start gap-2 text-left">
                            <Video className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-semibold text-sm">Video Tutorials</p>
                              <p className="text-xs text-muted-foreground">Watch & learn</p>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Tips for Success</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
                          <Coffee className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Practice Daily</h4>
                            <p className="text-xs text-muted-foreground">
                              Even 10 minutes a day builds consistency and improves results
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
                          <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Join Collaborative Games</h4>
                            <p className="text-xs text-muted-foreground">
                              Practice with others to build confidence in social settings
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
                          <Mic className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Start with AI Calls</h4>
                            <p className="text-xs text-muted-foreground">
                              No judgment, just practice - perfect for building phone confidence
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
                          <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Follow Your Learning Path</h4>
                            <p className="text-xs text-muted-foreground">
                              Structured progression ensures you build skills in the right order
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
