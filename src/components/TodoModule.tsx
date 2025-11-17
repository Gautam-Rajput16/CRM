import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Trash2, Edit3, PlusCircle, Calendar, Clock, X } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  frequency: 'Daily' | 'Weekly' | 'Monthly';
}

interface TodoModuleProps {
  userId: string;
}

const LOCAL_KEY = 'crm_todos';

function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export const TodoModule: React.FC<TodoModuleProps> = ({ userId }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [filter, setFilter] = useState<'All' | 'Daily' | 'Weekly' | 'Monthly'>('All');
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY + '_' + userId);
    if (stored) setTodos(JSON.parse(stored));
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY + '_' + userId, JSON.stringify(todos));
  }, [todos, userId]);

  function addTodo() {
    if (!text.trim()) return;
    setTodos([
      ...todos,
      { id: Date.now().toString(), text, completed: false, date: getToday(), frequency },
    ]);
    setText('');
    setFrequency('Daily');
    inputRef.current?.focus();
  }

  function updateTodo(id: string, changes: Partial<Todo>) {
    setTodos(todos => todos.map(t => t.id === id ? { ...t, ...changes } : t));
  }

  function deleteTodo(id: string) {
    setTodos(todos => todos.filter(t => t.id !== id));
  }

  function startEdit(todo: Todo) {
    setEditId(todo.id);
    setEditText(todo.text);
  }

  function saveEdit(id: string) {
    if (!editText.trim()) return;
    updateTodo(id, { text: editText });
    setEditId(null);
    setEditText('');
  }

  function filteredTodos() {
    if (filter === 'All') return todos;
    return todos.filter(t => t.frequency === filter);
  }

  // Summary counts
  const dailyCount = todos.filter(t => t.frequency === 'Daily').length;
  const weeklyCount = todos.filter(t => t.frequency === 'Weekly').length;
  const monthlyCount = todos.filter(t => t.frequency === 'Monthly').length;

  return (
    <div className="p-0 w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200">
      <div className="px-6 pt-6 pb-2 border-b flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" /> My Tasks
          </h2>
          <div className="flex gap-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${filter==='All'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'} cursor-pointer`} onClick={()=>setFilter('All')}>All</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${filter==='Daily'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'} cursor-pointer`} onClick={()=>setFilter('Daily')}>Daily</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${filter==='Weekly'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'} cursor-pointer`} onClick={()=>setFilter('Weekly')}>Weekly</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${filter==='Monthly'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'} cursor-pointer`} onClick={()=>setFilter('Monthly')}>Monthly</span>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Daily: {dailyCount}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Weekly: {weeklyCount}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Monthly: {monthlyCount}</span>
        </div>
      </div>
      <div className="px-6 py-4 flex gap-2 items-center border-b bg-gray-50">
        <input
          ref={inputRef}
          className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What needs to be done?"
          onKeyDown={e => { if (e.key === 'Enter') addTodo(); }}
        />
        <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="border border-gray-300 rounded-lg px-2 py-2 bg-white">
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 font-medium shadow" onClick={addTodo} title="Add Task">
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>
      <ul className="divide-y max-h-72 overflow-y-auto">
        {filteredTodos().map(todo => (
          <li key={todo.id} className="flex items-center gap-3 px-6 py-4 group hover:bg-blue-50 transition">
            <button
              className={`rounded-full border-2 w-6 h-6 flex items-center justify-center transition ${todo.completed ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white'}`}
              onClick={() => updateTodo(todo.id, { completed: !todo.completed })}
              title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {todo.completed && <CheckCircle className="h-5 w-5 text-blue-500" />}
            </button>
            {editId === todo.id ? (
              <>
                <input
                  className="border border-gray-300 rounded-lg px-2 py-1 flex-1"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(todo.id); if (e.key === 'Escape') setEditId(null); }}
                  autoFocus
                />
                <button className="text-green-600 px-1" onClick={() => saveEdit(todo.id)} title="Save"><CheckCircle className="h-5 w-5" /></button>
                <button className="text-gray-400 px-1" onClick={() => setEditId(null)} title="Cancel"><X className="h-5 w-5" /></button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-base ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{todo.text}</span>
                <span className="text-xs text-gray-400 font-medium px-2 py-1 rounded bg-gray-100">{todo.frequency}</span>
                <button className="text-blue-500 px-1 opacity-0 group-hover:opacity-100 transition" onClick={() => startEdit(todo)} title="Edit"><Edit3 className="h-5 w-5" /></button>
                <button className="text-red-500 px-1 opacity-0 group-hover:opacity-100 transition" onClick={() => deleteTodo(todo.id)} title="Delete"><Trash2 className="h-5 w-5" /></button>
              </>
            )}
          </li>
        ))}
        {filteredTodos().length === 0 && <li className="text-gray-400 py-8 text-center">No tasks found</li>}
      </ul>
      <div className="px-6 py-3 text-xs text-gray-500 border-t bg-gray-50 rounded-b-xl">
        <span>Tip: Click the <span className="text-blue-500 font-bold">circle</span> to mark complete. Hover for edit/delete.</span>
      </div>
    </div>
  );
};
