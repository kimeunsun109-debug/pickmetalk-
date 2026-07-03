-- Denormalized last message preview for conversation list (avoids messages table scan)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message_preview text,
  ADD COLUMN IF NOT EXISTS last_message_role text;

UPDATE conversations c
SET
  last_message_preview = LEFT(REGEXP_REPLACE(sub.content, '\s+', ' ', 'g'), 200),
  last_message_role = sub.role
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id,
    content,
    role
  FROM messages
  WHERE role IN ('user', 'assistant')
  ORDER BY conversation_id, created_at DESC
) sub
WHERE c.id = sub.conversation_id
  AND (c.last_message_preview IS NULL OR c.last_message_role IS NULL);
