# Task Management Feature - Documentation

## Overview

The Task Management feature is a comprehensive todo-list system integrated into your CRM, designed to help admins and team leaders assign tasks to employees and track their progress in real-time.

## Features

### For Admins & Team Leaders

1. **Create Tasks**
   - Assign tasks to specific employees
   - Set priority levels (Low, Medium, High, Urgent)
   - Define due dates and times
   - Add detailed descriptions
   - Tag tasks for better organization
   - Optionally link tasks to specific leads

2. **Task Management**
   - View all tasks across the organization
   - Filter by status, priority, assignee
   - Search tasks by title or description
   - Track task completion rates
   - Delete tasks when needed

3. **Monitoring & Reporting**
   - Dashboard with task statistics
   - View pending, in-progress, and completed tasks
   - Track overdue tasks
   - Monitor employee task performance

### For Employees (Sales Executives)

1. **View Assigned Tasks**
   - See all tasks assigned to them
   - Filter by status and priority
   - View task details and deadlines

2. **Update Task Status**
   - Mark tasks as "In Progress"
   - Mark tasks as "Completed"
   - Add notes to tasks

3. **Task Notifications**
   - Visual indicators for overdue tasks
   - Priority-based color coding
   - Due date reminders

## How to Use

### Setting Up the Database

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migration script: `supabase_tasks_migration.sql`
4. This will create:
   - `tasks` table with all necessary columns
   - Indexes for optimal performance
   - Row Level Security (RLS) policies
   - Automatic timestamp updates

### Creating a Task (Admin/Team Leader)

1. Navigate to **Task Management** in the sidebar
2. Click **Create Task** button
3. Fill in the required fields:
   - **Task Title**: Brief summary of the task
   - **Description**: Detailed explanation
   - **Priority**: Select urgency level
   - **Assign To**: Choose the employee
   - **Due Date**: Set deadline
   - **Due Time** (optional): Specific time
   - **Tags** (optional): Comma-separated tags

4. Click **Create Task**

### Managing Tasks (Employee)

1. Navigate to **My Tasks** in the sidebar
2. View all assigned tasks
3. Use filters to find specific tasks
4. Update task status using the dropdown:
   - **Pending**: Task not started
   - **In Progress**: Currently working on it
   - **Completed**: Task finished

5. Click expand button to view full details

## Task Priority Levels

- **🔴 Urgent**: Critical tasks requiring immediate attention
- **🟠 High**: Important tasks with near deadlines
- **🟡 Medium**: Standard priority tasks
- **🟢 Low**: Tasks that can be done when time permits

## Task Status Flow

```
Pending → In Progress → Completed
```

Any status can also be changed to **Cancelled** by admins.

## Features Comparison with Other CRMs

### Similar to Salesforce
- Task assignment and tracking
- Priority levels
- Due date management
- Status updates

### Similar to HubSpot
- Task filtering and search
- Visual status indicators
- Employee-specific task views
- Integration with leads

### Similar to Zoho CRM
- Tag-based organization
- Task notes and updates
- Overdue task highlighting
- Dashboard statistics

## Technical Details

### Database Schema

```sql
tasks (
  id: UUID (Primary Key)
  title: TEXT
  description: TEXT
  priority: ENUM ('low', 'medium', 'high', 'urgent')
  status: ENUM ('pending', 'in_progress', 'completed', 'cancelled')
  assigned_to: UUID (Foreign Key → users)
  assigned_to_name: TEXT
  assigned_by: UUID (Foreign Key → users)
  assigned_by_name: TEXT
  due_date: DATE
  due_time: TIME
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  completed_at: TIMESTAMP
  tags: TEXT[]
  related_lead_id: UUID (Foreign Key → leads)
  related_lead_name: TEXT
  notes: TEXT
)
```

### Components

1. **TaskManagement.tsx**
   - Main component for task management
   - Supports both admin and employee views
   - Handles task creation, updates, and deletion

2. **useTasks.ts**
   - Custom React hook for task operations
   - Manages task state and API calls
   - Handles data fetching and caching

3. **Task.ts**
   - TypeScript type definitions
   - Ensures type safety across the application

### Security

- Row Level Security (RLS) enabled
- Users can only view their assigned tasks
- Admins and team leaders have full access
- Secure task creation and updates

## Best Practices

### For Admins

1. **Clear Task Titles**: Use descriptive titles
2. **Detailed Descriptions**: Provide context and requirements
3. **Realistic Deadlines**: Set achievable due dates
4. **Appropriate Priority**: Don't mark everything as urgent
5. **Use Tags**: Organize tasks by category or project

### For Employees

1. **Update Status Regularly**: Keep tasks current
2. **Add Notes**: Document progress and blockers
3. **Check Daily**: Review tasks at start of day
4. **Communicate**: Reach out if tasks are unclear
5. **Complete On Time**: Respect deadlines

## Troubleshooting

### Tasks Not Showing

1. Check if the database migration was run
2. Verify RLS policies are enabled
3. Ensure user has proper role in profiles table

### Cannot Create Tasks

1. Verify user role is 'admin' or 'team_leader'
2. Check Supabase connection
3. Review browser console for errors

### Status Updates Not Working

1. Check user permissions
2. Verify task is assigned to current user
3. Check network connectivity

## Future Enhancements

Potential features for future updates:

- [ ] Task comments and discussions
- [ ] File attachments
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Email notifications
- [ ] Task dependencies
- [ ] Time tracking
- [ ] Subtasks
- [ ] Task history/audit log
- [ ] Mobile app notifications

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Test in Supabase SQL editor
4. Check browser console for errors

## Version History

- **v1.0.0** (Current)
  - Initial task management implementation
  - Basic CRUD operations
  - Admin and employee views
  - Priority and status management
  - Search and filtering
  - Dashboard statistics
