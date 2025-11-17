# Operations Dashboard Setup Guide

## Overview
This guide explains how to set up the new Operations Dashboard feature with three new roles:
- **Sales Team Leader**: Manages sales team with full sales access
- **Operations Team Leader**: Manages operations team and assigns tasks
- **Operations Team**: Executes operations tasks

## Database Setup

### Step 1: Run the SQL Migration
Execute the SQL migration file in your Supabase SQL Editor:

```bash
supabase_operations_tasks_migration.sql
```

This will create:
- `operations_tasks` table with proper structure
- Row Level Security (RLS) policies
- Indexes for performance
- Automatic name population triggers

### Step 2: Update Profiles Table (if needed)
Ensure your `profiles` table supports the new roles. The role column should accept:
- `user`
- `admin`
- `team_leader`
- `sales_executive`
- `sales_team_leader` (NEW)
- `operations_team_leader` (NEW)
- `operations_team` (NEW)

## Features

### Operations Dashboard
- **Modern Task Management**: Grid and list view modes
- **Real-time Notifications**: Bell icon with unread count
- **Task Filtering**: By status, priority, and search
- **Task Status Tracking**: Pending → In Progress → Completed
- **Priority Levels**: Low, Medium, High, Urgent
- **Role-based Access**:
  - Operations Team Leader & Admin: Can create, assign, and delete tasks
  - Operations Team: Can view and update their assigned tasks

### Role Permissions

#### Sales Team Leader
- ✅ View all leads
- ✅ Create and edit leads
- ✅ Manage users
- ✅ View analytics
- ✅ Assign meetings
- ✅ Access admin panel
- ❌ Delete users

#### Operations Team Leader
- ❌ No lead access
- ✅ Manage users
- ✅ View analytics
- ✅ Assign operations tasks
- ✅ Access operations panel
- ❌ Delete users

#### Operations Team
- ❌ No lead access
- ❌ No user management
- ✅ Complete assigned tasks
- ✅ Access operations panel

## Usage

### Creating Users with New Roles
1. Go to Admin Dashboard → Employees
2. Click "New User"
3. Select role from dropdown:
   - Operations Team (available to all admins)
   - Sales Team Leader (admin only)
   - Operations Team Leader (admin only)
4. Review role permissions in the cards below
5. Create user

### Accessing Operations Dashboard
Users with `operations_team_leader` or `operations_team` roles will automatically be redirected to `/operations` upon login.

### Creating Tasks (Admin/Operations TL only)
1. Click "New Task" button
2. Fill in task details:
   - Title
   - Description
   - Priority (Low/Medium/High/Urgent)
   - Assign to operations team member
   - Due date
3. Task appears in operations dashboard

### Managing Tasks (Operations Team)
1. View assigned tasks in dashboard
2. Click "Start" to move task to "In Progress"
3. Click "Complete" when done
4. Notifications show pending/in-progress tasks

## Technical Details

### Components
- `OperationsDashboard.tsx`: Main operations dashboard component
- Updated `UserManagement.tsx`: Includes new roles
- Updated `useUserRole.ts`: Added new role types and permissions

### Routing
- `/operations`: Operations dashboard (operations_team_leader, operations_team)
- `/admin`: Admin dashboard (admin, team_leader, sales_team_leader)
- `/sales`: Sales dashboard (sales_executive)

### Database Schema
```sql
operations_tasks (
  id: UUID (primary key)
  title: TEXT
  description: TEXT
  status: ENUM ('pending', 'in_progress', 'completed')
  priority: ENUM ('low', 'medium', 'high', 'urgent')
  assigned_to: UUID (foreign key to auth.users)
  assigned_by: UUID (foreign key to auth.users)
  assigned_to_name: TEXT (auto-populated)
  assigned_by_name: TEXT (auto-populated)
  due_date: TIMESTAMP
  created_at: TIMESTAMP
  completed_at: TIMESTAMP
  tags: TEXT[]
)
```

## Next Steps

### To Complete the Implementation:
1. Run the SQL migration in Supabase
2. Test creating users with new roles
3. Create sample operations tasks
4. Test task workflow (pending → in progress → completed)
5. Verify notifications work correctly

### Future Enhancements:
- Task creation modal in UI
- Task editing functionality
- Task comments/notes
- File attachments
- Task templates
- Recurring tasks
- Task analytics and reports

## Troubleshooting

### Issue: Can't see operations dashboard
**Solution**: Ensure user role is set to `operations_team_leader` or `operations_team` in the profiles table.

### Issue: Can't create tasks
**Solution**: Only admin and operations_team_leader roles can create tasks. Check RLS policies.

### Issue: Tasks not showing
**Solution**: Check that operations_tasks table exists and RLS policies are properly configured.

## Support
For issues or questions, refer to the main CRM documentation or contact the development team.
