# INTELLISCAN
## Intelligent File Intelligence & Storage Optimization Engine

An advanced university-level Data Structures and Algorithms (DSA) project combining a native **C++17 systems engine** with a high-performance **Node.js/Express REST backend** and an interactive **dark-themed SaaS dashboard**.

---

## 1. Project Introduction

**IntelliScan** is an enterprise-grade file intelligence, storage optimization, and duplicate discovery system. Modern computer systems, servers, and cloud environments routinely accumulate tens of thousands of duplicate, redundant, obsolete, and heavy files. Conventional storage analysis tools written in interpreted languages often suffer from heavy memory consumption, garbage collection pauses, and shallow filename-only comparisons.

IntelliScan solves this by pairing low-level, high-throughput C++17 systems programming with a responsive web dashboard. The C++17 engine interacts directly with the host filesystem, employing classical data structures—**Queue (FIFO)** for Breadth-First directory traversal, **Min-Heap Priority Queue** for $O(N \log K)$ heaviest consumer extraction, **Hash Maps** for $O(1)$ categorization, **FNV-1a 64-bit streaming content hashing**, **Byte-by-Byte binary verification**, and **Stack (LIFO)** for reversible metadata undo operations.

---

## 2. Problem Statement

Modern computing systems suffer from:
1. **Silent Storage Bloat**: Accidental file duplicates across nested directories (e.g. downloads, code copies, backup archives) consume gigabytes of disk space.
2. **Computational Inefficiency in Deduplication**: Naive $O(N^2)$ byte comparisons between all pairs of files grind disk I/O to a halt.
3. **Inefficient Sorting**: Sorting hundreds of thousands of files in $O(N \log N)$ just to find the top 10 largest storage consumers incurs needless CPU and memory overhead.
4. **False Positive Risks**: Tools that check only filenames or partial file sizes erroneously flag distinct files with the same name as duplicates.
5. **Lack of Educational Transparency**: Most commercial tools hide their internal algorithms, offering no academic insight for computer science students into how systems engineering and DSA work together.

---

## 3. Project Objectives

- **High-Throughput Native Scanning**: Implement Breadth-First Search (BFS) directory traversal in C++17 using `std::queue<fs::path>` and `std::filesystem` to traverse nested directory trees without stack overflow.
- **Collision-Free Duplicate Detection**: Develop a 4-tier filtering pipeline (Exact Size HashMap $\rightarrow$ 4KB Prefix Hash $\rightarrow$ 64-bit FNV-1a Streaming Hash $\rightarrow$ Byte-by-Byte `memcmp` verification) ensuring zero false positives.
- **Optimal Top-K Extraction**: Implement a Min-Heap Priority Queue of fixed size $K=10$ to retrieve the heaviest storage-consuming files in $O(N \log K)$ time and $O(K)$ space.
- **Reversible In-Memory Undo Operations**: Implement an operation Stack (LIFO) allowing users to safely remove and restore file records from application results in $O(1)$ time without modifying host disk files.
- **Interactive Academic Exploration**: Provide a built-in **Technology & DSA Architecture Explorer** featuring interactive visualizers (Stack, Queue, Priority Queue, Binary Search, Merge Sort, Hash Map) and mathematical complexity analysis.

---

## 4. Key Features

- **Real-Time Directory Scanning**: Full recursive inspection retrieving path, filename, extension, file size, last modified timestamp, and category.
- **Deterministic Duplicate Finder**: Identifies duplicate clusters, displays original vs redundant copies, calculates reclaimable storage byte-for-byte, and displays 64-bit hex fingerprints.
- **Storage Analyzer**: Interactive doughnut and bar charts visualizing storage allocation by file category and file extension.
- **Smart Multi-Algorithm Search Engine**:
  - Linear Search: $O(N)$ sequential scan by filename, extension, or size.
  - Binary Search: $O(\log N)$ logarithmic lookup after Merge Sort $O(N \log N)$.
  - Hash Map Lookup: Average $O(1)$ bucket lookup.
  - Displays real-time benchmarks: comparison counts and execution time in microseconds ($\mu\text{s}$).
- **Priority Manager**: Ranks all files by size and highlights top storage consumers.
- **Undo Manager**: Push/pop stack for in-memory metadata modifications. Original computer files are strictly read-only and never modified or deleted.
- **Audit History Log**: Tracks scan timestamps, file counts, and engine execution times in milliseconds.

---

## 5. Technology Stack

| Layer | Technology | Role in IntelliScan |
| :--- | :--- | :--- |
| **Frontend** | HTML5 / CSS3 / JavaScript (ES6+) | Semantic responsive layout, modern dark navy SaaS UI, dynamic DOM rendering |
| **Visualization** | Chart.js 4.x | High-performance Canvas charts for storage distributions |
| **Backend** | Node.js (v18+) & Express.js | Secure REST API server, parameter validation, child process execution |
| **Process Bridge** | `child_process.execFile` | Direct invocation of C++ executable without shell interpolation |
| **Core Engine** | C++17 (MinGW-W64 GCC 14.2+) | Native systems engine, algorithmic processing, JSON serialization |
| **Standard Library** | C++ STL & `<filesystem>` | Standard template library containers, kernel filesystem iterators |

---

## 6. Data Structures Implemented

### 1. `std::vector<FileRecord>` (Dynamic Contiguous Array)
- **Role**: Primary in-memory store for all scanned file records.
- **Working Principle**: Contiguous memory allocation. Provides $O(1)$ random access, high CPU cache locality, and amortized $O(1)$ insertion.
- **Complexity**: Access: $O(1)$ | Append: $O(1)$ amortized | Search: $O(N)$.

### 2. `std::stack<UndoAction>` (Last-In-First-Out)
- **Role**: Powers the Undo Manager for reversible metadata operations.
- **Working Principle**: Restricted container adaptor exposing only `push()`, `pop()`, and `top()`.
- **Complexity**: Push: $O(1)$ | Pop: $O(1)$ | Space: $O(U)$ where $U$ is action count.

### 3. `std::queue<fs::path>` (First-In-First-Out)
- **Role**: Manages directory traversal (Breadth-First Search) in `FileScanner`.
- **Working Principle**: Level-by-level directory discovery. Enqueues discovered child directories at the rear and processes the front directory.
- **Complexity**: Enqueue: $O(1)$ | Dequeue: $O(1)$ | Space: $O(\text{Tree Width})$.

### 4. `std::priority_queue<FileRecord>` (Min-Heap & Max-Heap)
- **Role**: Powers the Priority Manager to extract the Top $K=10$ largest files across $N$ files.
- **Working Principle**: Complete binary tree maintaining heap invariant. For a min-heap of size $K$, if a newly scanned file is larger than the root `top()`, the root is popped and the new file is pushed in $O(\log K)$.
- **Complexity**: Insertion: $O(\log K)$ | Extraction: $O(\log K)$ | Total: $O(N \log K)$ | Space: $O(K)$.

### 5. `std::unordered_map<Key, Value>` (Hash Map / Hash Table)
- **Role**: 
  1. Extension to Category mapping.
  2. Size bucket grouping in duplicate detection.
  3. Instant filename indexing in search.
- **Working Principle**: Hash function computes bucket index (`hash(key) % buckets`). Collisions handled via linked chaining.
- **Complexity**: Average Access: $O(1)$ | Worst-case (heavy collision): $O(N)$ | Space: $O(N)$.

### 6. 64-bit FNV-1a Hashing
- **Role**: Generates 64-bit hexadecimal fingerprints from raw file byte streams.
- **Working Principle**: Streaming algorithm with initial offset basis `14695981039346656037ULL`. For each byte: `hash = (hash ^ byte) * 1099511628211ULL`.
- **Complexity**: Time: $O(B)$ where $B$ is bytes read | Space: $O(1)$ (uses fixed 64KB chunk buffer).

### 7. `struct FileRecord`
- **Role**: Composite data model encapsulating path, filename, extension, category, size in bytes, timestamp, hash, and directory flag.

---

## 7. Algorithms Implemented

### A. 4-Tier Duplicate Detection Pipeline
```
All Files (N)
     ↓
[Stage 1: Size Hash Map Grouping] → Files with unique sizes discarded (Zero I/O!)
     ↓
[Stage 2: 4KB Prefix Hashing]      → Fast elimination of different file headers
     ↓
[Stage 3: Full FNV-1a Stream Hash] → 64-bit hash of candidate duplicate streams
     ↓
[Stage 4: Byte-by-Byte Verification] → Chunked memcmp guarantees zero collisions
     ↓
Confirmed Duplicate Groups
```

### B. Merge Sort ($O(N \log N)$)
Manual divide-and-conquer implementation in `SearchEngine.cpp`:
1. Divides array into two halves at `mid = left + (right - left) / 2`.
2. Recursively sorts both halves.
3. Merges sorted halves using two pointers in $O(N)$ time.

### C. Binary Search ($O(\log N)$)
Executed on the sorted vector to find target filenames:
1. Compares target with `files[mid]`.
2. If match, expands symmetrically to capture all files with that name in different directories.
3. If target is smaller, searches left subarray; else searches right subarray.

### D. Priority Queue Min-Heap Top-K Selection
Maintains a bounded heap of size $K=10$. Processes $N$ files in $O(N \log K)$ time, avoiding an $O(N \log N)$ full dataset sort.

---

## 8. Mathematical Complexity Summary

| Component / Algorithm | Best Case | Average Case | Worst Case | Space Complexity |
| :--- | :--- | :--- | :--- | :--- |
| `std::vector` Access | $O(1)$ | $O(1)$ | $O(1)$ | $O(N)$ |
| `std::queue` BFS Push/Pop | $O(1)$ | $O(1)$ | $O(1)$ | $O(W)$ |
| `std::stack` Undo Push/Pop | $O(1)$ | $O(1)$ | $O(1)$ | $O(U)$ |
| `std::priority_queue` Top-K | $O(1)$ | $O(\log K)$ | $O(\log K)$ | $O(K)$ |
| `std::unordered_map` Lookup | $O(1)$ | $O(1)$ | $O(N)$ | $O(N)$ |
| Linear Search | $O(1)$ | $O(N)$ | $O(N)$ | $O(1)$ |
| Merge Sort | $O(N \log N)$ | $O(N \log N)$ | $O(N \log N)$ | $O(N)$ |
| Binary Search | $O(1)$ | $O(\log N)$ | $O(\log N)$ | $O(1)$ |
| FNV-1a Stream Hashing | $O(B)$ | $O(B)$ | $O(B)$ | $O(1)$ buffer |
| Byte-by-Byte Verification | $O(1)$ (mismatch) | $O(B)$ | $O(B)$ (duplicate) | $O(1)$ buffer |

---

## 9. Project Directory Structure

```
IntelliScan/
├── frontend/
│   ├── index.html          # Responsive single-page application dashboard
│   ├── style.css           # Modern dark navy SaaS design stylesheet
│   ├── script.js           # Frontend controller, API hooks & DSA visualizers
│   └── assets/             # Graphical assets & icons
│
├── backend/
│   ├── server.js           # Express API server & static file host
│   ├── package.json        # Node.js dependencies (express, cors)
│   └── routes/
│       └── api.js          # REST endpoints & C++ process orchestration
│
├── cpp-engine/
│   ├── FileRecord.h        # Metadata structs (FileRecord, DuplicateGroup, etc.)
│   ├── JsonHelper.h        # High-throughput JSON serializer & string escaping
│   ├── FileScanner.h/.cpp  # Queue-based BFS filesystem scanner
│   ├── DuplicateDetector.h/.cpp # 4-tier deduplication & byte verification
│   ├── StorageAnalyzer.h/.cpp   # Category stats, extension distribution & recommendations
│   ├── SearchEngine.h/.cpp # Linear Search, Merge Sort, Binary Search, Hash Lookup
│   ├── PriorityManager.h/.cpp   # Min-Heap & Max-Heap Priority Queues
│   ├── UndoManager.h/.cpp  # Stack-based metadata undo operations
│   └── main.cpp            # C++ CLI entry point (scan, search, test)
│
├── test_sample_dir/        # Realistic test files (duplicates, code, empty, logs)
├── test_suite.js           # Automated end-to-end integration test runner
├── README.md               # Project documentation, report outline & viva guide
├── .gitignore              # Build and dependency ignore rules
└── package.json            # Root workspace scripts
```

---

## 10. Installation & Setup Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **C++17 Compiler** (GCC 9+, MinGW-W64 GCC 14.2+, Clang 10+, or MSVC 2019+)
- **Operating System**: Windows, macOS, or Linux

### Step 1: Clone or Navigate to Directory
```powershell
cd c:\Users\dharm\Downloads\Intelliscan
```

### Step 2: Install Backend Dependencies
```powershell
cd backend
npm install
cd ..
```

### Step 3: Compile the C++17 Engine
Using MinGW-W64 GCC:
```powershell
& "C:\Program Files\CodeBlocks\MinGW\bin\g++.exe" -std=c++17 -O2 -static -o cpp-engine\intelliscan_engine.exe cpp-engine\main.cpp cpp-engine\FileScanner.cpp cpp-engine\DuplicateDetector.cpp cpp-engine\StorageAnalyzer.cpp cpp-engine\SearchEngine.cpp cpp-engine\PriorityManager.cpp cpp-engine\UndoManager.cpp
```
*(On Linux/macOS, simply run: `g++ -std=c++17 -O2 -o cpp-engine/intelliscan_engine cpp-engine/*.cpp`)*

### Step 4: Verify C++ Engine Independently
```powershell
.\cpp-engine\intelliscan_engine.exe test
```
Expected output:
```json
{"status":"success","message":"IntelliScan C++17 DSA Engine Operational"}
```

### Step 5: Run Automated Integration Test Suite
```powershell
node test_suite.js
```
Runs 14 automated tests covering health checks, directory scanning, duplicate detection, storage analytics, category aggregation, Priority Queue largest files, Linear/Binary/Hash searches, and Stack undo/redo.

### Step 6: Launch IntelliScan Web Server
```powershell
node backend/server.js
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 11. College Project Report Outline

```
CHAPTER 1: INTRODUCTION
  1.1 Overview of Storage Intelligence & File Deduplication
  1.2 Problem Statement & Industry Motivation
  1.3 Objectives and Project Scope
  1.4 Organization of the Report

CHAPTER 2: LITERATURE REVIEW & THEORETICAL FOUNDATION
  2.1 Review of Existing Disk Auditing Applications (WinDirStat, TreeSize)
  2.2 Comparative Analysis: Interpreted vs. Compiled Systems Engines
  2.3 Review of Content Hashing Techniques (MD5, SHA-256 vs. FNV-1a)
  2.4 Theoretical Foundations of Classical Data Structures (Queue, Heap, Stack, Hash Map)

CHAPTER 3: SYSTEM ARCHITECTURE & DESIGN
  3.1 Architectural Decomposition (Frontend - Backend - Native Engine)
  3.2 Process Orchestration & Inter-Process Communication (IPC) via JSON
  3.3 Security Model: Child Process Validation & Non-Destructive In-Memory Stacks
  3.4 Database/Memory Schema: Struct FileRecord & Composite Containers

CHAPTER 4: DATA STRUCTURES & ALGORITHMS IMPLEMENTATION
  4.1 Breadth-First Directory Traversal using Queue (std::queue)
  4.2 Four-Tier Collision-Free Duplicate Detection Pipeline
  4.3 Top-K Storage Consumption Analysis using Min-Heap Priority Queue
  4.4 Multi-Paradigm Search Engine: Merge Sort, Binary Search & Hash Map Lookup
  4.5 Stack-Based Metadata Reversible Undo Framework

CHAPTER 5: EXPERIMENTAL RESULTS & PERFORMANCE EVALUATION
  5.1 Benchmarking C++17 Directory Traversal vs. Node.js fs.readdir
  5.2 Algorithmic Execution Time Comparisons (Linear vs. Binary vs. Hash Lookup)
  5.3 Memory Footprint Analysis under Large File Quantities
  5.4 Verification of Zero False Positives in Duplicate Detection

CHAPTER 6: CONCLUSION & FUTURE SCOPE
  6.1 Summary of Contributions
  6.2 Limitations of the Current Version
  6.3 Future Work: Multi-threaded Async Scanning, Hard-link Creation, SIMD Acceleration

REFERENCES & APPENDIX
```

---

## 12. 35 Technical Viva Questions & Answers

### General & Architecture Questions

**Q1: What is IntelliScan and what is its primary technical purpose?**  
**A:** IntelliScan is a hybrid file intelligence and storage optimization application combining a native C++17 DSA engine with a Node.js/Express REST API and an interactive web dashboard. It scans local directory hierarchies, detects duplicate files without false positives, categorizes storage usage, extracts top consumers via a Priority Queue, and provides an interactive educational DSA explorer.

**Q2: Why did you build the core engine in C++17 rather than implementing it in Node.js/JavaScript?**  
**A:** C++17 compiles directly to machine code, provides native OS filesystem syscall access (`std::filesystem`), and avoids the garbage collection (GC) pauses and V8 memory overhead inherent to JavaScript. This allows IntelliScan to traverse tens of thousands of files in milliseconds with minimal, predictable memory usage.

**Q3: How does Node.js communicate with the compiled C++ executable?**  
**A:** Node.js executes the compiled binary using `child_process.execFile`. Arguments are passed as an isolated string array (preventing shell injection), and the C++ engine writes its results as structured JSON directly to standard output (`stdout`), which Node.js streams into memory.

**Q4: How does IntelliScan prevent command injection attacks?**  
**A:** By using `child_process.execFile` instead of `child_process.exec`. `execFile` invokes the binary directly without spawning a system shell (cmd.exe or /bin/sh), preventing command chaining (`&`, `;`, `|`). Furthermore, all input directory paths are validated for existence on disk before being passed to the binary.

**Q5: Does IntelliScan ever delete or modify the user's original computer files?**  
**A:** No. IntelliScan adheres to a strict read-only design pattern. File records removed in the UI are popped from in-memory session arrays and recorded in a Stack (LIFO); the physical files on disk remain completely untouched.

---

### Data Structures Questions

**Q6: Why is `std::vector` used for storing file records instead of a linked list (`std::list`)?**  
**A:** `std::vector` stores elements in contiguous memory, maximizing CPU cache locality (L1/L2 cache prefetching) during iterations. It provides $O(1)$ random access, whereas `std::list` incurs pointer chasing overhead and significant memory fragmentation due to node allocations.

**Q7: How is the Queue (`std::queue`) used during directory scanning?**  
**A:** `FileScanner` uses `std::queue<fs::path>` to perform Breadth-First Search (BFS) directory traversal. When a directory is visited, its subdirectories are pushed to the rear of the queue and regular files are recorded. This prevents recursion stack overflow on deeply nested trees.

**Q8: What is the advantage of BFS using a Queue over recursive Depth-First Search (DFS)?**  
**A:** Deep directory structures (such as `node_modules` or complex software builds) can contain 50+ nested directory levels, which can exhaust the call stack in recursive DFS and cause stack overflow crashes. The Queue stores paths on the heap, safely handling arbitrarily deep structures.

**Q9: How is the Stack (`std::stack`) applied in the Undo Manager?**  
**A:** When a user removes a file record from the application view, the `FileRecord` struct and a timestamp are pushed onto `undoStack`. When the user clicks "Undo", `undoStack.pop()` retrieves the most recently removed record in $O(1)$ time and restores it to the active view, implementing classic Last-In-First-Out (LIFO) semantics.

**Q10: Why is a Min-Heap Priority Queue used to find the Top 10 largest files instead of sorting the whole array?**  
**A:** Sorting $N$ files using Merge Sort or Quick Sort takes $O(N \log N)$ time. By maintaining a Min-Heap of fixed size $K=10$, each of the $N$ files is compared to the root in $O(1)$ and inserted in $O(\log K)$ time. The total time is $O(N \log K)$, which for $K=10$ is effectively $O(N \cdot \log 10) \approx O(3.32 N)$, significantly faster than $O(N \log N)$ when $N = 100,000$.

**Q11: What is the space complexity of extracting the Top-K largest files using a Min-Heap?**  
**A:** $O(K)$. The heap never stores more than $K$ elements at any given time, regardless of whether $N$ is 10,000 or 10,000,000 files.

**Q12: Where is `std::unordered_map` utilized in IntelliScan?**  
**A:** It is used in three critical modules:
1. `FileScanner`: Maps file extensions (e.g., `.cpp`, `.pdf`) to high-level categories (`Programming Files`, `Documents`) in $O(1)$ average time.
2. `DuplicateDetector`: Groups files by exact file size in Stage 1.
3. `StorageAnalyzer`: Aggregates byte consumption and file counts per category.
4. `SearchEngine`: Provides instant $O(1)$ filename lookups.

**Q13: What happens in `std::unordered_map` during a hash collision?**  
**A:** When two different keys produce the same hash bucket index (`hash(key) % bucket_count`), they are placed into the same bucket in a linked chain (separate chaining). If all keys collide in the same bucket, lookup degrades from $O(1)$ to $O(N)$.

---

### Duplicate Detection & Hashing Questions

**Q14: Explain the 4-tier filtering pipeline in `DuplicateDetector`.**  
**A:**
1. **Tier 1 (Size Bucketing)**: Groups files by exact size in `std::unordered_map<uintmax_t, vector<FileRecord>>`. Files with unique sizes cannot have duplicates and are discarded immediately without disk reads.
2. **Tier 2 (Prefix Hash)**: For size collisions, reads only the first 4KB to compute a fast prefix hash. Files with differing headers are discarded.
3. **Tier 3 (Full Content Hash)**: Computes a 64-bit FNV-1a streaming hash across the entire file in 64KB chunks.
4. **Tier 4 (Byte-by-Byte Verification)**: Streams candidate identical files simultaneously and verifies them using `std::memcmp` to eliminate any theoretical hash collisions.

**Q15: Why is checking file size first so computationally important?**  
**A:** Disk I/O is the slowest operation in computing (orders of magnitude slower than CPU operations). In typical filesystems, over 85–90% of files have unique byte sizes. By filtering on size metadata alone, the engine eliminates 90%+ of files from requiring any file reading.

**Q16: Why was FNV-1a chosen over MD5 or SHA-256 for content hashing?**  
**A:** FNV-1a (Fowler–Noll–Vo) is a non-cryptographic hash function with excellent dispersion, high avalanche properties, and very few CPU instructions per byte. Because IntelliScan conducts a final byte-by-byte verification in Tier 4, cryptographic collision resistance (like SHA-256) is unnecessary, and FNV-1a runs up to 3–4x faster.

**Q17: What are the mathematical constants used in 64-bit FNV-1a?**  
**A:**
- FNV offset basis: `14695981039346656037ULL` ($2^{64} - 2^{63} + 2^{62} - \dots$)
- FNV prime: `1099511628211ULL` ($2^{40} + 2^8 + 0xb3$)

**Q18: What is the streaming buffer size used during file hashing and why?**  
**A:** 64KB (65,536 bytes). A 64KB chunk buffer fits comfortably within CPU L2/L3 cache while matching typical OS filesystem cluster read blocks, preventing high RAM consumption on large multi-gigabyte files.

**Q19: How does byte-by-byte verification work?**  
**A:** Both candidate files are opened in binary mode (`std::ios::binary`). The engine reads 64KB from File 1 into Buffer A, and 64KB from File 2 into Buffer B. It compares them using `std::memcmp`. If any byte mismatches, it immediately returns `false`. If both files reach end-of-file (`eof`) with all buffers identical, they are guaranteed identical.

**Q20: If two files have different names but identical contents, does IntelliScan detect them as duplicates?**  
**A:** Yes! IntelliScan detects content identity, not name identity. Two files named `draft.docx` and `final_v2.docx` sharing identical byte contents are correctly identified as a duplicate group.

**Q21: If two files have identical names but different contents in different folders, are they flagged as duplicates?**  
**A:** No. Because their contents (or sizes) differ, they fail Tier 1, Tier 2, or Tier 4 checks and are never flagged as duplicates.

---

### Search Engine & Algorithms Questions

**Q22: What search algorithms are implemented in IntelliScan?**  
**A:** Linear Search ($O(N)$), Binary Search ($O(\log N)$ on sorted array), and Hash Map Lookup (Average $O(1)$).

**Q23: Why must the vector be sorted before executing Binary Search?**  
**A:** Binary Search relies on the monotonic ordering invariant: if the target is less than the middle element, it is guaranteed to be in the left half; if greater, in the right half. Without pre-sorting, this assumption fails and Binary Search produces incorrect results.

**Q24: What sorting algorithm is implemented before Binary Search and why?**  
**A:** Merge Sort. It is a stable, divide-and-conquer algorithm with guaranteed $O(N \log N)$ worst-case time complexity, avoiding the $O(N^2)$ worst-case degeneration of Quick Sort on already-sorted or reversed inputs.

**Q25: What is the time complexity of Merge Sort in the best, average, and worst cases?**  
**A:** Best Case: $O(N \log N)$, Average Case: $O(N \log N)$, Worst Case: $O(N \log N)$. Its recurrence relation is $T(N) = 2T(N/2) + O(N)$, which solves to $\Theta(N \log N)$ by the Master Theorem.

**Q26: What is the auxiliary space complexity of Merge Sort?**  
**A:** $O(N)$. Merging two sorted subarrays requires temporary auxiliary buffers `L` and `R` proportional to the subarray lengths.

**Q27: How does Hash Map search achieve $O(1)$ average lookup time?**  
**A:** It computes the hash code of the target filename, maps it to a bucket index, and retrieves matching records directly from that bucket without inspecting the other elements in the table.

**Q28: In what situation would Linear Search be preferred over Binary Search?**  
**A:** When performing single unindexed queries on unsorted data where the cost of sorting ($O(N \log N)$) exceeds the cost of a single linear scan ($O(N)$), or when searching for substring patterns within filenames (which cannot be binary searched).

---

### Filesystem & Error Handling Questions

**Q29: How does the C++ engine handle symbolic links and prevent circular loops?**  
**A:** In `FileScanner.cpp`, the iterator checks `entry.is_symlink()`. Symbolic links to directories are skipped to prevent infinite recursive loops created by circular links.

**Q30: How does IntelliScan handle permission denied errors on restricted folders (e.g. system files)?**  
**A:** By using `std::filesystem::directory_options::skip_permission_denied` and passing `std::error_code ec` to filesystem methods. This ensures that any inaccessible file or directory silently increments `skippedErrorsCount` without crashing or terminating the scan.

**Q31: How are file modification timestamps retrieved and formatted?**  
**A:** C++17 `entry.last_write_time()` returns a `fs::file_time_type`. The engine converts this to `std::chrono::system_clock::time_point`, converts to `std::time_t`, and uses thread-safe `localtime_s` (Windows) / `localtime_r` (POSIX) to format it as `YYYY-MM-DD HH:MM:SS`.

**Q32: What storage optimization recommendations does the engine generate?**  
**A:**
1. Potential duplicate storage savings.
2. Heavy files alert for files exceeding 100MB.
3. Temporary and log cleanup suggestions (`.tmp`, `.log`, `.bak`, `.dump`).
4. Zero-byte ghost file detection.
5. Category dominance alerts when one category accounts for over 50% of total disk usage.

---

### Viva Practical & Viva Defense Questions

**Q33: Can you explain how you compiled and linked the C++17 executable statically?**  
**A:** Using MinGW-W64 GCC with `-std=c++17 -O2 -static`. The `-static` flag statically links `libstdc++`, `libgcc`, and `winpthread` into `intelliscan_engine.exe`, making it a completely self-contained binary that runs on any Windows machine without requiring external MinGW DLLs in the system path.

**Q34: How did you verify your application against edge cases?**  
**A:** We designed a dedicated test suite verifying:
- Empty directories (handles 0 files without division-by-zero crashes).
- Invalid/non-existent directory paths (returns structured JSON error).
- Nested subdirectories with deep directory trees.
- Different files with identical names in separate folders (verified not flagged as duplicates).
- Identical content with different filenames (verified properly grouped).
- Zero-byte files (ignored for deduplication savings, flagged under empty file warnings).

**Q35: What are the primary future improvements planned for IntelliScan?**  
**A:**
1. Multi-threaded parallel directory scanning using C++17 thread pools and `std::async`.
2. Hardware-accelerated SIMD (AVX2/AVX-512) vectorized byte comparisons.
3. User-confirmed NTFS hard-link deduplication (replacing duplicate files with pointer hard-links to reclaim storage without moving files).
4. Exportable PDF and CSV storage audit reports for system administrators.

---

## 13. Limitations & Future Scope

### Limitations
- **Single-Threaded I/O**: Directory traversal and hashing operate sequentially on a single thread.
- **Strict Read-Only Mode**: In adherence to safety guidelines, files cannot be physically removed from disk from the web interface.
- **Local Filesystem Only**: Cloud storage (S3, Google Drive) and network shares requiring specialized OAuth APIs are not natively traversed without mounting.

### Future Scope
- **Multi-Threaded Producer-Consumer Architecture**: Employing a thread pool where worker threads consume directories from a lock-free queue.
- **SIMD / AVX-512 Vectorization**: Accelerated string matching and byte comparison leveraging CPU vector registers.
- **Automated Hard-Linking**: Providing an opt-in utility to turn duplicate files into NTFS hard-links, reclaiming physical disk clusters while keeping directory paths intact.

---

## 14. License & Academic Attribution
Developed as an advanced academic Computer Science & Engineering (CSE) Data Structures and Algorithms capstone project. Distributed under the MIT License.
