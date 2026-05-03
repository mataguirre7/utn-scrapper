-- Create Task table for subtasks within activities
CREATE TABLE IF NOT EXISTS "Task" (
  id TEXT PRIMARY KEY,
  "externalId" TEXT NOT NULL UNIQUE,
  "activityId" TEXT NOT NULL REFERENCES "Activity"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  url TEXT,
  "dueDate" TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  "rawHash" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_activity_id ON "Task"("activityId");
CREATE INDEX idx_task_external_id ON "Task"("externalId");
