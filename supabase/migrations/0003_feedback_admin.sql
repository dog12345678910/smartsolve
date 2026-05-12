-- Allow specific admin emails to read all feedback rows.
-- Add more emails to the array below as needed.

drop policy if exists "admins see all feedback" on feedback;
create policy "admins see all feedback" on feedback
  for select using (
    auth.email() = any (array[
      'cameronimpemba@gmail.com'
    ]::text[])
  );
