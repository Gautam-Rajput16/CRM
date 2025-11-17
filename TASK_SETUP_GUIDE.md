# Quick Setup Guide - Task Management Feature

## Step-by-Step Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase_tasks_migration.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Wait for success message: "Success. No rows returned"

### Step 2: Verify Database Setup

Run this query to verify the table was created:

```sql
SELECT * FROM tasks LIMIT 1;
```

You should see the table structure (even if empty).

### Step 3: Test the Feature

#### As Admin/Team Leader:

1. Log into your CRM
2. Look for **Task Management** in the sidebar
3. Click **Create Task**
4. Fill in the form:
   - Title: "Test Task"
   - Description: "This is a test task"
   - Priority: Medium
   - Assign To: Select an employee
   - Due Date: Tomorrow's date
5. Click **Create Task**
6. Verify the task appears in the list

#### As Employee:

1. Log in as the assigned employee
2. Look for **My Tasks** in the sidebar
3. Verify the test task appears
4. Change status to "In Progress"
5. Verify the status updates

### Step 4: Common Issues & Solutions

#### Issue: "tasks table does not exist"
**Solution**: Run the migration script again in Supabase SQL Editor

#### Issue: "permission denied for table tasks"
**Solution**: Ensure RLS policies were created. Re-run the migration script.

#### Issue: Tasks not showing for employees
**Solution**: 
- Verify the employee's user ID matches in the database
- Check that `assigned_to` field has correct UUID
- Ensure user is logged in correctly

#### Issue: Cannot create tasks
**Solution**:
- Verify your user role is 'admin' or 'team_leader' in profiles table
- Check this query:
```sql
SELECT id, name, role FROM profiles WHERE id = 'YOUR_USER_ID';
```

### Step 5: Customize (Optional)

#### Change Task Priorities
Edit `src/types/Task.ts` line 1:
```typescript
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
```

#### Add Custom Fields
1. Add column to database:
```sql
ALTER TABLE tasks ADD COLUMN custom_field TEXT;
```

2. Update TypeScript types in `src/types/Task.ts`

3. Update UI in `src/components/TaskManagement.tsx`

### Step 6: Production Checklist

Before deploying to production:

- [ ] Database migration completed successfully
- [ ] RLS policies tested and working
- [ ] Admin can create tasks
- [ ] Employees can view their tasks
- [ ] Status updates work correctly
- [ ] Filters and search function properly
- [ ] Overdue tasks display correctly
- [ ] Mobile view tested (responsive design)

### Step 7: User Training

Share these quick tips with your team:

**For Admins:**
- Create clear, actionable task titles
- Set realistic due dates
- Use priority levels appropriately
- Add detailed descriptions

**For Employees:**
- Check tasks daily
- Update status as you work
- Mark completed tasks promptly
- Add notes for any blockers

## Quick Reference

### Task Statuses
- **Pending**: Not started
- **In Progress**: Currently working
- **Completed**: Finished
- **Cancelled**: No longer needed

### Priority Colors
- 🔴 **Urgent**: Red
- 🟠 **High**: Orange
- 🟡 **Medium**: Yellow
- 🟢 **Low**: Green

### Keyboard Shortcuts (Future Enhancement)
- `Ctrl+N`: New task (admin)
- `Ctrl+F`: Focus search
- `Esc`: Close modal

## Support & Resources

- **Full Documentation**: See `TASK_MANAGEMENT_README.md`
- **Database Schema**: See `supabase_tasks_migration.sql`
- **Type Definitions**: See `src/types/Task.ts`
- **Main Component**: See `src/components/TaskManagement.tsx`

## Testing Checklist

Use this checklist to verify everything works:

### Admin Tests
- [ ] Can access Task Management section
- [ ] Can create a new task
- [ ] Can assign task to employee
- [ ] Can set all priority levels
- [ ] Can set due date and time
- [ ] Can add tags
- [ ] Can view all tasks
- [ ] Can filter by status
- [ ] Can filter by priority
- [ ] Can filter by assignee
- [ ] Can search tasks
- [ ] Can delete tasks
- [ ] Can see task statistics

### Employee Tests
- [ ] Can access My Tasks section
- [ ] Can view assigned tasks
- [ ] Can update task status
- [ ] Can filter tasks
- [ ] Can search tasks
- [ ] Can see overdue indicators
- [ ] Cannot see other employees' tasks
- [ ] Cannot delete tasks
- [ ] Cannot create tasks

### Edge Cases
- [ ] Overdue tasks show red border
- [ ] Completed tasks don't show as overdue
- [ ] Empty state shows when no tasks
- [ ] Loading state shows while fetching
- [ ] Error messages display properly
- [ ] Modal closes on cancel
- [ ] Form validation works
- [ ] Required fields enforced

## Next Steps

1. ✅ Complete database setup
2. ✅ Test with sample data
3. ✅ Train admin users
4. ✅ Train employees
5. ✅ Monitor usage
6. ✅ Gather feedback
7. ✅ Plan enhancements

## Need Help?

If you encounter issues:

1. Check browser console for errors (F12)
2. Verify Supabase connection
3. Check RLS policies in Supabase
4. Review the full documentation
5. Test with a different user role

---

**Congratulations!** Your task management system is ready to use. Start by creating a few test tasks to familiarize yourself with the features.
