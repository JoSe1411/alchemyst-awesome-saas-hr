'use client';

import React, { useState } from 'react';
import { useRightPanelStore } from '@/stores/rightPanelStore';
import { useGeneralChatStore } from '@/stores/generalChatStore';

interface JDForm {
  roleTitle: string;
  seniority: string;
  responsibilities: string;
  mustHave: string;
  niceHave: string;
  location: string;
  employmentType: string;
  aboutCompany: string;
}

const JDGenerator: React.FC = () => {
  const { setMode } = useRightPanelStore();
  const { addMessage } = useGeneralChatStore();

  const [form, setForm] = useState<JDForm>({
    roleTitle: '',
    seniority: 'Junior',
    responsibilities: '',
    mustHave: '',
    niceHave: '',
    location: 'Remote',
    employmentType: 'Full-time',
    aboutCompany: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleChange = (field: keyof JDForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch('/api/jd-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error('Failed to generate JD');
      const data = await resp.json();
      setResult(data.content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToChat = () => {
    if (!result) return;
    addMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: result,
      timestamp: new Date(),
    });
    setMode('chat');
  };

  if (result) {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-6 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
        <h3 className="text-xl font-bold mb-4">Generated Job Description</h3>
        <div className="flex-1 overflow-y-auto prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>') }} />
        <div className="mt-6 flex gap-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => {
            if (!result) return;
            const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const safeTitle = form.roleTitle ? form.roleTitle.toLowerCase().replace(/[^a-z0-9]+/g,'-') : 'job-description';
            link.download = `${safeTitle}.md`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
          }}>Download JD (.md)</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSendToChat}>Send to Chat</button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setMode('chat')}>Back to Chat</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h3 className="text-xl font-bold">Job Description Builder</h3>
      {/* Role Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Role / Title</label>
        <input value={form.roleTitle} onChange={handleChange('roleTitle')} className="w-full p-2 rounded border" required />
      </div>

      {/* Seniority */}
      <div>
        <label className="block text-sm font-medium mb-1">Seniority</label>
        <select value={form.seniority} onChange={handleChange('seniority')} className="w-full p-2 rounded border bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          {['Junior', 'Mid', 'Senior', 'Lead'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Responsibilities */}
      <div>
        <label className="block text-sm font-medium mb-1">Key Responsibilities</label>
        <textarea value={form.responsibilities} onChange={handleChange('responsibilities')} className="w-full p-2 rounded border" rows={3} required />
      </div>

      {/* Must Have Skills */}
      <div>
        <label className="block text-sm font-medium mb-1">Must-have Skills</label>
        <textarea value={form.mustHave} onChange={handleChange('mustHave')} className="w-full p-2 rounded border" rows={2} required />
      </div>

      {/* Nice Have */}
      <div>
        <label className="block text-sm font-medium mb-1">Nice-to-have Skills (optional)</label>
        <textarea value={form.niceHave} onChange={handleChange('niceHave')} className="w-full p-2 rounded border" rows={2} />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-1">Location / Remote?</label>
        <input value={form.location} onChange={handleChange('location')} className="w-full p-2 rounded border" />
      </div>

      {/* Employment Type */}
      <div>
        <label className="block text-sm font-medium mb-1">Employment Type</label>
        <select value={form.employmentType} onChange={handleChange('employmentType')} className="w-full p-2 rounded border bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          {['Full-time', 'Part-time', 'Contract', 'Internship'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* About Company */}
      <div>
        <label className="block text-sm font-medium mb-1">About Company (optional)</label>
        <textarea value={form.aboutCompany} onChange={handleChange('aboutCompany')} className="w-full p-2 rounded border" rows={2} />
      </div>

      {/* Buttons */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-3 mt-2">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Generating…' : 'Generate JD'}
        </button>
        <button type="button" onClick={() => setMode('chat')} className="bg-gray-500 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default JDGenerator; 