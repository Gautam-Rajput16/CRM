  # CRM Roles & Permissions Summary

## 🎭 All Roles Overview

### 1. **User** (Basic Role)
**Color Badge**: Gray  
**Description**: Basic access with limited permissions

| Permission | Status |
|------------|--------|
| View own leads | ✅ |
| Create leads | ✅ |
| Edit own leads | ✅ |
| View all leads | ❌ |
| Manage users | ❌ |
| Delete users | ❌ |
| View analytics | ❌ |
| Assign meetings | ❌ |
| Access admin panel | ❌ |

---

### 2. **Sales Executive**
**Color Badge**: Green  
**Description**: Enhanced access for sales operations

| Permission | Status |
|------------|--------|
| View own leads | ✅ |
| Create leads | ✅ |
| Edit own leads | ✅ |
| View all leads | ❌ |
| Manage users | ❌ |
| Delete users | ❌ |
| View analytics | ✅ |
| Assign meetings | ❌ |
| Access admin panel | ❌ |

---

### 3. **Team Leader**
**Color Badge**: Blue  
**Description**: Supervisory access with team management

| Permission | Status |
|------------|--------|
| View own leads | ✅ |
| Create leads | ✅ |
| Edit own leads | ✅ |
| View all leads | ✅ |
| Manage users | ✅ |
| Delete users | ❌ |
| View analytics | ✅ |
| Assign meetings | ✅ |
| Access admin panel | ✅ |

---

### 4. **Sales Team Leader** ⭐ NEW
**Color Badge**: Indigo  
**Description**: Lead sales team with full sales access

| Permission | Status |
|------------|--------|
| View own leads | ✅ |
| Create leads | ✅ |
| Edit own leads | ✅ |
| View all leads | ✅ |
| Manage users | ✅ |
| Delete users | ❌ |
| View analytics | ✅ |
| Assign meetings | ✅ |
| Access admin panel | ✅ |

**Dashboard**: Admin Dashboard (`/admin`)

---

### 5. **Operations Team Leader** ⭐ NEW
**Color Badge**: Orange  
**Description**: Manage operations team and tasks

| Permission | Status |
|------------|--------|
| View own leads | ❌ |
| Create leads | ❌ |
| Edit own leads | ❌ |
| View all leads | ❌ |
| Manage users | ✅ |
| Delete users | ❌ |
| View analytics | ✅ |
| Assign operations tasks | ✅ |
| Access operations panel | ✅ |

**Dashboard**: Operations Dashboard (`/operations`)

---

### 6. **Operations Team** ⭐ NEW
**Color Badge**: Teal  
**Description**: Execute operations tasks and activities

| Permission | Status |
|------------|--------|
| View own leads | ❌ |
| Create leads | ❌ |
| Edit own leads | ❌ |
| View all leads | ❌ |
| Manage users | ❌ |
| Delete users | ❌ |
| View analytics | ❌ |
| Complete assigned tasks | ✅ |
| Access operations panel | ✅ |

**Dashboard**: Operations Dashboard (`/operations`)

---

### 7. **Admin**
**Color Badge**: Purple  
**Description**: Full system access with all permissions

| Permission | Status |
|------------|--------|
| View own leads | ✅ |
| Create leads | ✅ |
| Edit own leads | ✅ |
| View all leads | ✅ |
| Manage users | ✅ |
| Delete users | ✅ |
| View analytics | ✅ |
| Assign meetings | ✅ |
| Access admin panel | ✅ |
| Assign operations tasks | ✅ |
| Access operations panel | ✅ |

**Dashboard**: Admin Dashboard (`/admin`)

---

## 🔐 Access Control Matrix

| Feature | User | Sales Exec | Team Leader | Sales TL | Ops TL | Ops Team | Admin |
|---------|------|------------|-------------|----------|--------|----------|-------|
| **Leads Management** | Own Only | Own Only | All | All | ❌ | ❌ | All |
| **User Management** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Delete Users** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Analytics** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Assign Meetings** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Operations Tasks** | ❌ | ❌ | ❌ | ❌ | Create/Assign | Complete | Create/Assign |
| **Admin Panel** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Operations Panel** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 🚀 Dashboard Routing

| Role | Default Route | Dashboard |
|------|---------------|-----------|
| User | `/` | CRM Dashboard |
| Sales Executive | `/sales` | Sales Dashboard |
| Team Leader | `/admin` | Admin Dashboard |
| Sales Team Leader | `/admin` | Admin Dashboard |
| Operations Team Leader | `/operations` | Operations Dashboard |
| Operations Team | `/operations` | Operations Dashboard |
| Admin | `/admin` | Admin Dashboard |

---

## 📊 Operations Dashboard Features

### For Operations Team Leader & Admin:
- ✅ View all operations tasks
- ✅ Create new tasks
- ✅ Assign tasks to team members
- ✅ Delete tasks
- ✅ View task analytics
- ✅ Filter by status/priority
- ✅ Grid and list view modes
- ✅ Real-time notifications

### For Operations Team:
- ✅ View assigned tasks only
- ✅ Update task status (Start/Complete)
- ✅ Filter personal tasks
- ✅ Notification bell for pending tasks
- ✅ Grid and list view modes
- ❌ Cannot create or delete tasks

---

## 🎨 UI Features

### Modern Task Interface:
- **Grid View**: Card-based layout with visual priority badges
- **List View**: Table format for quick scanning
- **Notification Bell**: Shows unread count with dropdown
- **Status Tracking**: Visual indicators (Pending → In Progress → Completed)
- **Priority Colors**:
  - 🔴 Urgent: Red
  - 🟠 High: Orange
  - 🟡 Medium: Yellow
  - 🟢 Low: Green

### Stats Dashboard:
- Total Tasks
- Pending Tasks
- In Progress Tasks
- Completed Tasks

---

## 📝 Notes

- Only **Admin** can delete users
- **Sales Team Leader** has same permissions as Team Leader but focused on sales
- **Operations roles** are completely separate from sales/leads management
- All operations team members get real-time task notifications
- Task assignments are tracked with automatic name population
