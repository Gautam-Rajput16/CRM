# Task Notification System - Documentation

## Overview

The Task Notification System provides **real-time notifications** to employees when tasks are assigned to them by admins or team leaders. This feature ensures employees are immediately aware of new responsibilities and can prioritize their work effectively.

## Features

### 🔔 Notification Bell Icon
- **Visual indicator** with unread count badge
- **Dropdown panel** showing recent task notifications
- **Priority-based color coding** for quick identification
- **Mark as read** functionality
- **Auto-refresh** every 30 seconds

### 📬 Toast Notifications
- **Instant pop-up** when new tasks are assigned
- **Priority emoji indicators** (🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low)
- **Task details** including title, assignee, and due date
- **Auto-dismiss** after 8 seconds
- **Styled notifications** with blue theme

### 🔄 Auto-Polling System
- **Checks for new tasks** every 30 seconds
- **No Supabase real-time** subscription needed
- **Efficient polling** with date-based filtering
- **LocalStorage tracking** for read status

## How It Works

### For Admins/Team Leaders

1. **Create a Task**
   - Navigate to Task Management
   - Click "Create Task"
   - Fill in task details
   - Assign to an employee
   - Click "Create Task"

2. **Confirmation Notification**
   - Admin sees success message
   - Confirms task was assigned
   - Shows employee name
   - Indicates employee will be notified

### For Employees

1. **Receive Notification**
   - Bell icon shows red badge with count
   - Toast notification appears automatically
   - Shows task title and priority
   - Displays who assigned it and due date

2. **View Notifications**
   - Click bell icon to open dropdown
   - See all recent tasks (last 7 days)
   - Unread tasks highlighted in blue
   - Click notification to mark as read

3. **Manage Notifications**
   - Individual "mark as read"
   - "Mark all as read" button
   - Notifications auto-refresh
   - Persistent across sessions

## UI Components

### Notification Bell

```
┌─────────────────────────────────────────────────┐
│  🔔 (3)  ← Bell icon with unread count          │
│  ↓                                               │
│  ┌───────────────────────────────────────────┐  │
│  │ Task Notifications        Mark all read   │  │
│  │ 3 unread notifications                    │  │
│  ├───────────────────────────────────────────┤  │
│  │ 🔴 Follow up with client ABC         ●   │  │
│  │ Assigned by: Admin                        │  │
│  │ URGENT Priority • Due: Nov 15, 2025       │  │
│  │ 5m ago                                    │  │
│  ├───────────────────────────────────────────┤  │
│  │ 🟠 Prepare monthly report            ●   │  │
│  │ Assigned by: Manager                      │  │
│  │ HIGH Priority • Due: Nov 20, 2025         │  │
│  │ 1h ago                                    │  │
│  ├───────────────────────────────────────────┤  │
│  │ 🟡 Update CRM database                   │  │
│  │ Assigned by: Admin                        │  │
│  │ MEDIUM Priority • Due: Nov 25, 2025       │  │
│  │ 3h ago                                    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Toast Notification

```
┌─────────────────────────────────────────────────┐
│ 📬  🔴 New Task: Follow up with client ABC      │
│     Assigned by: Admin • Due: Nov 15, 2025      │
└─────────────────────────────────────────────────┘
```

## Technical Implementation

### Components

1. **`useTaskNotifications.ts`** - Custom React hook
   - Fetches notifications from database
   - Polls every 30 seconds
   - Tracks read/unread status
   - Shows toast for new tasks

2. **`TaskNotificationBell.tsx`** - Bell icon component
   - Displays unread count
   - Dropdown with notifications list
   - Mark as read functionality
   - Responsive design

3. **`TaskManagement.tsx`** - Enhanced with notifications
   - Shows confirmation when task created
   - Indicates employee will be notified
   - Priority-based emoji display

### Data Flow

```
Admin Creates Task
       ↓
Task Saved to Database
       ↓
Admin Sees Confirmation
       ↓
Employee's Hook Polls Database (30s)
       ↓
New Task Detected
       ↓
Toast Notification Shown
       ↓
Bell Badge Updated
       ↓
Employee Clicks Bell
       ↓
Dropdown Shows Task
       ↓
Employee Clicks Notification
       ↓
Marked as Read
       ↓
Badge Count Decreases
```

### Polling Strategy

- **Interval**: 30 seconds
- **Query**: Last 7 days of tasks
- **Filter**: Assigned to current user
- **Comparison**: Check against last checked time
- **Storage**: LocalStorage for read status

## Configuration

### Polling Interval

To change the polling frequency, edit `useTaskNotifications.ts`:

```typescript
// Current: 30 seconds
const interval = setInterval(fetchNotifications, 30000);

// Change to 60 seconds
const interval = setInterval(fetchNotifications, 60000);

// Change to 15 seconds
const interval = setInterval(fetchNotifications, 15000);
```

### Notification Duration

To change how long toast notifications stay visible:

```typescript
// Current: 8 seconds
toast.success(message, {
  duration: 8000,
  // ...
});

// Change to 10 seconds
toast.success(message, {
  duration: 10000,
  // ...
});
```

### Notification History

To change how many days of notifications to show:

```typescript
// Current: 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

// Change to 14 days
const fourteenDaysAgo = new Date();
fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
```

## Integration Points

### Dashboards with Notifications

1. **CRMDashboard** (Employee Dashboard)
   - Bell icon in header
   - Next to lead notifications
   - Accessible from all tabs

2. **SalesExecutiveDashboard**
   - Bell icon in header
   - Visible on all sections
   - Quick access to tasks

3. **AdminDashboard**
   - Can add for admins too
   - See all organization tasks
   - Monitor assignment status

## Best Practices

### For Admins

1. **Clear Task Titles**
   - Use descriptive, action-oriented titles
   - Example: "Follow up with Client ABC" not "Task 1"

2. **Appropriate Priority**
   - Don't mark everything as urgent
   - Use priority levels meaningfully
   - Reserve urgent for true emergencies

3. **Realistic Due Dates**
   - Give employees enough time
   - Consider workload
   - Account for complexity

4. **Detailed Descriptions**
   - Provide context and requirements
   - Include relevant links or references
   - Specify expected outcomes

### For Employees

1. **Check Notifications Regularly**
   - Look for bell badge
   - Review new tasks promptly
   - Acknowledge receipt

2. **Mark as Read**
   - Clear notifications after viewing
   - Keep bell count accurate
   - Use "Mark all as read" when needed

3. **Act on Urgent Tasks**
   - Prioritize red (urgent) tasks
   - Check due dates
   - Update status promptly

4. **Communicate Issues**
   - If task is unclear, ask admin
   - Report blockers early
   - Update task notes

## Troubleshooting

### Notifications Not Appearing

**Problem**: Employee doesn't see new task notifications

**Solutions**:
1. Check if polling is working (console logs)
2. Verify task is assigned to correct user ID
3. Clear browser cache and localStorage
4. Check browser console for errors
5. Ensure database migration was run

### Bell Count Incorrect

**Problem**: Badge shows wrong number

**Solutions**:
1. Click "Mark all as read"
2. Clear localStorage: `localStorage.removeItem('readTaskNotifications')`
3. Refresh the page
4. Check if tasks are within 7-day window

### Toast Not Showing

**Problem**: Toast notification doesn't appear

**Solutions**:
1. Check browser notification permissions
2. Verify toast library is installed
3. Check console for errors
4. Ensure polling interval is running
5. Test with manual task creation

### Polling Not Working

**Problem**: Notifications don't auto-update

**Solutions**:
1. Check network tab for API calls
2. Verify Supabase connection
3. Check if useEffect is running
4. Look for JavaScript errors
5. Test with shorter interval (15s)

## Performance Considerations

### Optimizations

1. **Efficient Queries**
   - Only fetch last 7 days
   - Filter by assigned user
   - Limit to recent tasks

2. **LocalStorage Caching**
   - Store read status locally
   - Reduce database queries
   - Faster UI updates

3. **Polling Interval**
   - 30 seconds balances freshness and load
   - Not too frequent to overload server
   - Not too slow to miss notifications

4. **Conditional Rendering**
   - Only show dropdown when clicked
   - Lazy load notification list
   - Minimize re-renders

### Monitoring

Track these metrics:
- Average notification delivery time
- Polling success rate
- User engagement (clicks, marks as read)
- Task completion time after notification

## Future Enhancements

Potential improvements:

- [ ] Browser push notifications
- [ ] Email notifications for urgent tasks
- [ ] SMS notifications (optional)
- [ ] Notification preferences per user
- [ ] Snooze notifications
- [ ] Notification categories
- [ ] Sound alerts (optional)
- [ ] Desktop notifications
- [ ] Notification history page
- [ ] Bulk actions on notifications
- [ ] Filter notifications by priority
- [ ] Search notifications
- [ ] Export notification history

## Comparison with Other CRMs

### Similar to Salesforce
- Task assignment notifications
- Bell icon with badge
- Dropdown notification panel
- Priority indicators

### Similar to HubSpot
- Real-time toast notifications
- Clean, modern UI
- Mark as read functionality
- Notification history

### Similar to Asana
- Visual priority indicators
- Due date display
- Assignee information
- Quick actions

### Similar to Monday.com
- Color-coded priorities
- Emoji indicators
- Relative time display
- Auto-refresh

## Support

### Common Questions

**Q: Can I disable notifications?**
A: Currently no, but you can mark all as read to clear the badge.

**Q: How long are notifications stored?**
A: Last 7 days of task assignments are shown.

**Q: Can I get email notifications too?**
A: Not yet, but it's planned for future updates.

**Q: Why 30-second polling?**
A: Balances real-time updates with server load.

**Q: Can admins see notifications?**
A: Yes, admins can add the bell to their dashboard too.

## Summary

The Task Notification System provides:
- ✅ Instant awareness of new tasks
- ✅ Priority-based visual indicators
- ✅ Easy notification management
- ✅ No complex real-time setup needed
- ✅ Reliable polling mechanism
- ✅ Clean, modern UI
- ✅ Mobile-friendly design
- ✅ Persistent notification history

Employees stay informed and can prioritize work effectively, while admins have confidence their task assignments are communicated immediately.

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Polling Interval**: 30 seconds  
**Notification History**: 7 days
