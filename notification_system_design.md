# Stage 1

## Architecture

The backend fetches notifications from the API and sorts them into a priority inbox. Each notification type has a weight:
- Placement = 3
- Result = 2  
- Event = 1

Sorting is done first by weight (higher weight = higher priority), then by timestamp (newer first) as a tiebreaker. We pick the top 10 after sorting.

## How to handle high volume streams

If we get thousands of notifications coming in real-time, sorting everything each time is slow (O(N log N)).

A better approach:
1. Use a min-heap of size 10 (bounded heap)
2. For each new notification, compare it with the smallest item in the heap
3. If the new one has higher priority, swap it in
4. This way we only do O(N log K) work where K=10, which is basically O(N)

This keeps the top 10 list updated efficiently without re-sorting the whole array every time.
