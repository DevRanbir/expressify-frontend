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
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase";
import { ref, onValue, off, get, remove } from "firebase/database";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
  TrashIcon,
  History as HistoryIcon,
  Calendar,
  Bell,
  Download,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TrainingSession = {
  id: string;
  name: string;
  module: string;
  date: string;
  duration: string;
  type: "Textual" | "Vocal" | "Visual";
  status: "Excellent" | "Very Good" | "Good" | "Needs Work";
  score: number;
};

type GameData = {
  gameId: string;
  score: number;
  timeElapsed: number;
  hintsUsed?: number;
  difficulty: string;
  completedWords?: number;
  totalWords?: number;
  accuracy?: number;
  puzzlesSolved?: number;
  messageCount?: number;
  topic?: string;
  userStance?: string;
  aiStance?: string;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  status: string;
  timestamp: number;
};

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<TrainingSession> = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.name} ${row.original.module}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const typeFilterFn: FilterFn<TrainingSession> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const type = row.getValue(columnId) as string;
  return filterValue.includes(type);
};

const RowActions = ({ row }: { row: Row<TrainingSession> }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex size-8 p-0 data-[state=open]:bg-muted"
        >
          <EllipsisIcon className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View Details</DropdownMenuItem>
        <DropdownMenuItem>View Feedback</DropdownMenuItem>
        <DropdownMenuItem>Retry Session</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive">
          Delete Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "date",
      desc: true,
    },
  ]);

  const [data, setData] = useState<TrainingSession[]>([]);

  // Helper function to convert game data to training session
  const convertGameDataToSession = (gameId: string, gameData: GameData, dataId: string): TrainingSession => {
    const formatDuration = (seconds: number) => {
      if (seconds < 60) {
        return `${seconds} sec`;
      }
      const mins = Math.floor(seconds / 60);
      return `${mins} min`;
    };

    const getGameName = (gameId: string) => {
      const gameNames: Record<string, string> = {
        "crossword-puzzle": "Crossword Puzzle",
        "chat-simulator": "Chat Simulator",
        "grammar-goblin": "Grammar Goblin",
        "debate-master": "Debate Master",
        "story-builder": "Story Builder",
        "vocabulary-quest": "Vocabulary Quest",
        "word-bucket": "Word Bucket",
      };
      return gameNames[gameId] || gameId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    };

    const getStatus = (scoreOrAccuracy: number): "Excellent" | "Very Good" | "Good" | "Needs Work" => {
      if (scoreOrAccuracy >= 90) return "Excellent";
      if (scoreOrAccuracy >= 75) return "Very Good";
      if (scoreOrAccuracy >= 60) return "Good";
      return "Needs Work";
    };

    // For debate-master, use score instead of accuracy
    const displayScore = gameData.gameId === "debate-master" || gameId === "debate-master" 
      ? gameData.score 
      : gameData.accuracy || gameData.score;

    return {
      id: dataId,
      name: getGameName(gameData.gameId || gameId),
      module: "Textual Practice",
      date: new Date(gameData.timestamp).toISOString().split("T")[0],
      duration: formatDuration(gameData.timeElapsed),
      type: "Textual",
      status: getStatus(displayScore),
      score: displayScore,
    };
  };

  // Clean up duplicate entries
  const cleanupDuplicates = async () => {
    if (!user) return;

    try {
      const gamesRef = ref(database, `games/crossword-puzzle/${user.uid}`);
      const snapshot = await get(gamesRef);

      if (!snapshot.exists()) return;

      const gamesData = snapshot.val();
      const entries: Array<{ key: string; data: GameData }> = [];

      // Convert to array
      Object.entries(gamesData).forEach(([key, value]) => {
        entries.push({ key, data: value as GameData });
      });

      // Sort by timestamp
      entries.sort((a, b) => a.data.timestamp - b.data.timestamp);

      const toDelete: string[] = [];
      const seen = new Map<string, { key: string; timestamp: number }>();

      // Find duplicates
      for (const entry of entries) {
        const signature = `${entry.data.score}-${entry.data.accuracy}-${entry.data.timeElapsed}-${entry.data.hintsUsed}`;
        const existing = seen.get(signature);

        if (existing) {
          // Check if within 10 seconds of each other
          const timeDiff = Math.abs(entry.data.timestamp - existing.timestamp);
          if (timeDiff < 10000) {
            toDelete.push(entry.key);
            console.log(`Duplicate found: ${entry.key}`);
          } else {
            // Update to newest entry with same signature
            seen.set(signature, { key: entry.key, timestamp: entry.data.timestamp });
          }
        } else {
          seen.set(signature, { key: entry.key, timestamp: entry.data.timestamp });
        }
      }

      // Delete duplicates
      if (toDelete.length > 0) {
        console.log(`Cleaning up ${toDelete.length} duplicate entries...`);
        for (const key of toDelete) {
          const entryRef = ref(database, `games/crossword-puzzle/${user.uid}/${key}`);
          await remove(entryRef);
        }
        console.log(`Successfully removed ${toDelete.length} duplicates`);
      }
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
    }
  };

  // Run cleanup on mount
  useEffect(() => {
    if (user) {
      cleanupDuplicates();
    }
  }, [user]);

  // Fetch game data from Firebase
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const allSessions: TrainingSession[] = [];
    let loadedCount = 0;
    const gamesToLoad = ['crossword-puzzle', 'chat-simulator', 'grammar-goblin', 'debate-master', 'vocabulary-quest', 'word-bucket'];

    gamesToLoad.forEach((gameId) => {
      const gamesRef = ref(database, `games/${gameId}/${user.uid}`);
      
      onValue(gamesRef, (snapshot) => {
        const gamesData = snapshot.val();
        
        if (gamesData) {
          Object.entries(gamesData).forEach(([key, value]) => {
            const gameData = value as GameData;
            allSessions.push(convertGameDataToSession(gameId, gameData, key));
          });
        }

        loadedCount++;
        
        if (loadedCount === gamesToLoad.length) {
          // Sort by date descending
          allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setData(allSessions);
          setIsLoading(false);
        }
      });
    });

    return () => {
      gamesToLoad.forEach((gameId) => {
        const gamesRef = ref(database, `games/${gameId}/${user.uid}`);
        off(gamesRef);
      });
    };
  }, [user]);

  const columns: ColumnDef<TrainingSession>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 28,
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      size: 220,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Module",
      accessorKey: "module",
      size: 160,
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      },
      size: 120,
    },
    {
      header: "Duration",
      accessorKey: "duration",
      size: 100,
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            row.getValue("type") === "Textual" && "border-blue-500 text-blue-500",
            row.getValue("type") === "Vocal" && "border-green-500 text-green-500",
            row.getValue("type") === "Visual" && "border-purple-500 text-purple-500"
          )}
        >
          {row.getValue("type")}
        </Badge>
      ),
      size: 100,
      filterFn: typeFilterFn,
    },
    {
      header: "Performance",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge
          className={cn(
            row.getValue("status") === "Excellent" &&
              "bg-green-500 text-white",
            row.getValue("status") === "Very Good" &&
              "bg-blue-500 text-white",
            row.getValue("status") === "Good" &&
              "bg-yellow-500 text-white",
            row.getValue("status") === "Needs Work" &&
              "bg-red-500 text-white"
          )}
        >
          {row.getValue("status")}
        </Badge>
      ),
      size: 120,
    },
    {
      header: "Score",
      accessorKey: "score",
      cell: ({ row }) => {
        return <span className="font-semibold">{row.getValue("score")}%</span>;
      },
      size: 80,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <RowActions row={row} />,
      size: 60,
      enableHiding: false,
    },
  ];

  const handleDeleteRows = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const updatedData = data.filter(
      (item) => !selectedRows.some((row) => row.original.id === item.id)
    );
    setData(updatedData);
    table.resetRowSelection();
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  });

  // Get unique type values
  const uniqueTypeValues = useMemo(() => {
    const typeColumn = table.getColumn("type");
    if (!typeColumn) return [];
    const values = Array.from(typeColumn.getFacetedUniqueValues().keys());
    return values.sort();
  }, [table.getColumn("type")?.getFacetedUniqueValues()]);

  const selectedTypes = useMemo(() => {
    const filterValue = table.getColumn("type")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("type")?.getFilterValue()]);

  const handleTypeChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("type")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table.getColumn("type")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  const totalSessions = data.length;
  const avgScore = totalSessions > 0 
    ? Math.round(data.reduce((sum, session) => sum + session.score, 0) / totalSessions)
    : 0;
  const excellentSessions = data.filter(session => session.status === "Excellent").length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Data refreshes automatically via Firebase listener
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // Export functionality
    console.log("Exporting training history...");
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          {/* Custom Header for History Page */}
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
                  <BreadcrumbItem>
                    <BreadcrumbPage>Training History</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2 px-4">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
                {/* Page Title & Stats */}
                <div className="px-2 sm:px-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
                        <HistoryIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                        Training History
                      </h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Track your progress and review past sessions
                      </p>
                    </div>
                    <div className="hidden items-center gap-4 sm:flex">
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold">{totalSessions}</span>
                        <span className="text-xs text-muted-foreground">Total Sessions</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold">{avgScore}%</span>
                        <span className="text-xs text-muted-foreground">Avg Score</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-primary">{excellentSessions}</span>
                        <span className="text-xs text-muted-foreground">Excellent</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Stats */}
                <div className="grid grid-cols-3 gap-3 sm:hidden">
                  <div className="flex flex-col items-center rounded-lg border p-3">
                    <span className="text-xl font-bold">{totalSessions}</span>
                    <span className="text-xs text-muted-foreground">Sessions</span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg border p-3">
                    <span className="text-xl font-bold">{avgScore}%</span>
                    <span className="text-xs text-muted-foreground">Avg Score</span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg border p-3">
                    <span className="text-xl font-bold text-primary">{excellentSessions}</span>
                    <span className="text-xs text-muted-foreground">Excellent</span>
                  </div>
                </div>
                {/* Table Controls */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-1 items-center gap-2">
                      <div className="relative flex-1 md:max-w-sm">
                        <FilterIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/80" />
                        <Input
                          placeholder="Filter by name or module..."
                          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                          onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                          }
                          className="h-9 w-full pl-9"
                        />
                      </div>

                      {/* Type Filter */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9">
                            <ListFilterIcon className="mr-2 size-4" />
                            Type
                            {selectedTypes.length > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {selectedTypes.length}
                              </Badge>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-3" align="start">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Filter by type</div>
                            {uniqueTypeValues.map((type) => (
                              <label
                                key={type}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                <Checkbox
                                  checked={selectedTypes.includes(type)}
                                  onCheckedChange={(checked) =>
                                    handleTypeChange(!!checked, type)
                                  }
                                />
                                <span className="text-sm">{type}</span>
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center gap-2">
                      {table.getSelectedRowModel().rows.length > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                              <TrashIcon className="mr-2 size-4" />
                              Delete ({table.getSelectedRowModel().rows.length})
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete sessions?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {table.getSelectedRowModel().rows.length} training session(s) from your history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteRows}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {/* Column Visibility */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9">
                            <Columns3Icon className="mr-2 size-4" />
                            View
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                              return (
                                <DropdownMenuCheckboxItem
                                  key={column.id}
                                  className="capitalize"
                                  checked={column.getIsVisible()}
                                  onCheckedChange={(value) =>
                                    column.toggleVisibility(!!value)
                                  }
                                >
                                  {column.id}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              return (
                                <TableHead
                                  key={header.id}
                                  style={{
                                    width:
                                      header.getSize() !== 150
                                        ? header.getSize()
                                        : undefined,
                                  }}
                                >
                                  {header.isPlaceholder ? null : (
                                    <div
                                      className={cn(
                                        header.column.getCanSort() &&
                                          "flex cursor-pointer select-none items-center gap-2",
                                        header.column.id === "actions" &&
                                          "justify-end"
                                      )}
                                      onClick={header.column.getToggleSortingHandler()}
                                    >
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                      {header.column.getCanSort() && (
                                        <div className="flex flex-col">
                                          <ChevronUpIcon
                                            className={cn(
                                              "size-3 text-muted-foreground/50",
                                              header.column.getIsSorted() === "asc" &&
                                                "text-foreground"
                                            )}
                                          />
                                          <ChevronDownIcon
                                            className={cn(
                                              "-mt-1.5 size-3 text-muted-foreground/50",
                                              header.column.getIsSorted() === "desc" &&
                                                "text-foreground"
                                            )}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </TableHead>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-24 text-center"
                            >
                              <div className="flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Loading training history...
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-24 text-center"
                            >
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  No training sessions found. Start a training session to see your history!
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <p className="text-nowrap text-sm">Rows per page</p>
                      <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                          table.setPageSize(Number(value));
                        }}
                      >
                        <SelectTrigger className="h-9 w-16">
                          <SelectValue
                            placeholder={table.getState().pagination.pageSize}
                          />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[10, 20, 30, 40, 50].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                              {pageSize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <p className="text-nowrap text-sm font-medium tabular-nums">
                      {`${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}`}{" "}
                      of {table.getFilteredRowModel().rows.length}
                    </p>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => table.firstPage()}
                            disabled={!table.getCanPreviousPage()}
                          >
                            <ChevronFirstIcon className="size-4" />
                            <span className="sr-only">First page</span>
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                          >
                            <ChevronLeftIcon className="size-4" />
                            <span className="sr-only">Previous page</span>
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                          >
                            <ChevronRightIcon className="size-4" />
                            <span className="sr-only">Next page</span>
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-9"
                            onClick={() => table.lastPage()}
                            disabled={!table.getCanNextPage()}
                          >
                            <ChevronLastIcon className="size-4" />
                            <span className="sr-only">Last page</span>
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
