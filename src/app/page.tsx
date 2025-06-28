import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
      <div className="w-full max-w-4xl h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col">
        <header className="p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">HR AI Assistant</h1>
        </header>
        <Chat />
      </div>
    </main>
  );
}
