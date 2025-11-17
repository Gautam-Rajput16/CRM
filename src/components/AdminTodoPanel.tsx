import React, { useState, useEffect } from 'react';
import { UserCircle, PlusCircle, Filter, Users, ClipboardList, CheckCircle, X } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  assignedTo: string;
}

interface User {
  id: string;
  name: string;
}

const USERS: User[] = [
  { id: '1', name: 'Gautam' },
  { id: '2', name: 'Priya' },
  { id: '3', name: 'Rahul' },
];

const LOCAL_KEY = 'crm_all_todos';

function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export const AdminTodoPanel: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [assignedTo, setAssignedTo] = useState(USERS[0].id);
  const [userFilter, setUserFilter] = useState('all');
  const [freqFilter, setFreqFilter] = useState<'All' | 'Daily' | 'Weekly' | 'Monthly'>('All');

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) setTodos(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(todos));
  }, [todos]);

  function addTodo() {
    if (!text.trim()) return;
    setTodos([
      ...todos,
      { id: Date.now().toString(), text, completed: false, date: getToday(), frequency, assignedTo },
    ]);
    setText('');
    setFrequency('Daily');
    setAssignedTo(USERS[0].id);
  }

  function updateTodo(id: string, changes: Partial<Todo>) {
    setTodos(todos => todos.map(t => t.id === id ? { ...t, ...changes } : t));
  }

  function deleteTodo(id: string) {
    setTodos(todos => todos.filter(t => t.id !== id));
  }

  function filteredTodos() {
    return todos.filter(t =>
      (userFilter === 'all' || t.assignedTo === userFilter) &&
      (freqFilter === 'All' || t.frequency === freqFilter)
    );
  }

  // Reports & Insights
  const summary = USERS.map(u => {
    const userTodos = todos.filter(t => t.assignedTo === u.id);
    const completed = userTodos.filter(t => t.completed).length;
    return {
      user: u,
      total: userTodos.length,
      completed,
      daily: userTodos.filter(t => t.frequency === 'Daily').length,
      weekly: userTodos.filter(t => t.frequency === 'Weekly').length,
      monthly: userTodos.filter(t => t.frequency === 'Monthly').length,
    };
  });

  return (
    <div className="p-6 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><ClipboardList className="h-6 w-6 text-blue-500" /> Admin Todos</h2>
      <div className="flex gap-3 mb-4">
        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="all">All Users</option>
          {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={freqFilter} onChange={e => setFreqFilter(e.target.value as any)} className="border rounded px-3 py-2">
          <option value="All">All Frequencies</option>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>
      <div className="flex gap-2 mb-6">
        <input
          className="border rounded px-3 py-2 flex-1"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Assign a new task..."
        />
        <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="border rounded px-2 py-2">
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="border rounded px-2 py-2">
          {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded flex items-center gap-1" onClick={addTodo}><PlusCircle className="h-5 w-5" /> Assign</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {USERS.filter(u => userFilter === 'all' || userFilter === u.id).map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCircle className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-lg">{user.name}</span>
            </div>
            <ul className="divide-y">
              {filteredTodos().filter(t => t.assignedTo === user.id).map(todo => (
                <li key={todo.id} className="flex items-center gap-2 py-2 group">
                  <button className={`rounded-full border-2 w-6 h-6 flex items-center justify-center ${todo.completed ? 'border-green-500 bg-green-100' : 'border-gray-300 bg-white'}`} onClick={() => updateTodo(todo.id, { completed: !todo.completed })}>{todo.completed && <CheckCircle className="h-5 w-5 text-green-500" />}</button>
                  <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{todo.text}</span>
                  <span className="text-xs text-gray-400 px-2 py-1 rounded bg-gray-100">{todo.frequency}</span>
                  <button className="text-red-500 px-1 opacity-0 group-hover:opacity-100 transition" onClick={() => deleteTodo(todo.id)} title="Delete"><X className="h-5 w-5" /></button>
                </li>
              ))}
              {filteredTodos().filter(t => t.assignedTo === user.id).length === 0 && <li className="text-gray-400 py-4 text-center">No tasks</li>}
            </ul>
          </div>
        ))}
      </div>
      <h3 className="text-xl font-bold mt-8 mb-2 flex items-center gap-2"><Users className="h-5 w-5 text-purple-500" /> Reports & Insights</h3>
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-700 border-b">
              <th className="py-2 text-left">User</th>
              <th className="py-2">Total</th>
              <th className="py-2">Completed</th>
              <th className="py-2">Daily</th>
              <th className="py-2">Weekly</th>
              <th className="py-2">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(row => (
              <tr key={row.user.id} className="border-b">
                <td className="py-2 font-medium flex items-center gap-2"><UserCircle className="h-4 w-4 text-blue-600" />{row.user.name}</td>
                <td className="py-2 text-center">{row.total}</td>
                <td className="py-2 text-center text-green-600 font-bold">{row.completed}</td>
                <td className="py-2 text-center">{row.daily}</td>
                <td className="py-2 text-center">{row.weekly}</td>
                <td className="py-2 text-center">{row.monthly}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
