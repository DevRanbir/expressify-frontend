/**
 * Firebase Duplicate Cleanup Script
 * 
 * This script helps identify and remove duplicate entries from the Firebase database.
 * Run this in the browser console on any authenticated page.
 * 
 * Usage:
 * 1. Copy this entire script
 * 2. Open browser console (F12)
 * 3. Paste and press Enter
 * 4. Call: await cleanupDuplicates()
 */

import { ref, get, remove } from "firebase/database";
import { database } from "@/lib/firebase";

interface GameEntry {
  key: string;
  data: {
    score: number;
    timeElapsed: number;
    hintsUsed: number;
    accuracy: number;
    timestamp: number;
    [key: string]: any;
  };
}

export async function cleanupDuplicates(userId: string) {
  try {
    console.log("Starting duplicate cleanup...");
    
    const gameRef = ref(database, `games/crossword-puzzle/${userId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      console.log("No data found");
      return;
    }

    const data = snapshot.val();
    const entries: GameEntry[] = [];

    // Convert to array with keys
    Object.entries(data).forEach(([key, value]) => {
      entries.push({
        key,
        data: value as GameEntry['data']
      });
    });

    // Sort by timestamp
    entries.sort((a, b) => a.data.timestamp - b.data.timestamp);

    const toDelete: string[] = [];
    const seen = new Set<string>();

    // Find duplicates
    for (const entry of entries) {
      const signature = `${entry.data.score}-${entry.data.accuracy}-${entry.data.timeElapsed}-${entry.data.hintsUsed}`;
      const timeBucket = Math.floor(entry.data.timestamp / 10000); // 10 second buckets
      const uniqueKey = `${signature}-${timeBucket}`;

      if (seen.has(uniqueKey)) {
        toDelete.push(entry.key);
        console.log(`Duplicate found: ${entry.key}`, entry.data);
      } else {
        seen.add(uniqueKey);
      }
    }

    console.log(`Found ${toDelete.length} duplicates to remove`);

    // Remove duplicates
    if (toDelete.length > 0) {
      const confirmDelete = confirm(
        `Found ${toDelete.length} duplicate entries. Do you want to delete them?`
      );

      if (confirmDelete) {
        for (const key of toDelete) {
          const entryRef = ref(database, `games/crossword-puzzle/${userId}/${key}`);
          await remove(entryRef);
          console.log(`Deleted: ${key}`);
        }
        console.log("Cleanup completed!");
        return toDelete.length;
      } else {
        console.log("Cleanup cancelled");
        return 0;
      }
    } else {
      console.log("No duplicates found!");
      return 0;
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
}

// For manual browser console usage
(window as any).cleanupDuplicates = cleanupDuplicates;
