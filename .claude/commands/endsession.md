---
description: End-of-session ritual — gates, log entry, RESUME note, then commit+push on confirm
model: claude-sonnet-5
---

End of session. Close out the step per house conventions:

1. Confirm the applicable gates ran clean this session (all six for code changes;
   npm test outside the sandbox). If any didn't, stop and tell me — do not log or commit.
2. Draft the record: append ONE entry PER task closed this session to
   docs/IMPLEMENTATION_LOG.md — each takes the next free step number, in the order the
   work landed (## Step N — title (date), **Shipped:** / **Owed:**). A half-finished
   task still gets its own entry with the remainder in Owed, but stays unticked. Then
   write ONE new RESUME HERE note (after the last entry) naming the next step, and mark
   the previous note as carried. Tick each fully closed task and move its block to
   steering/tasks-done.md — if scope grew beyond a task's text, file a new letter-suffixed
   task instead of absorbing it.
3. Show me the log entries, the new RESUME note, and the proposed commit message —
   "Step N (task X): title" for one step, "Steps N–M: summary" for several (house
   style). One commit, one push, ONLY after I confirm.
