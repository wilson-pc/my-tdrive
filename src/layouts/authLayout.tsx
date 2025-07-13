import { useOutlet } from "react-router";

  export function AuthLayout() {
    const outlet = useOutlet()
    return (
      <div className="flex min-h-screen">
        <nav className="w-64 bg-gray-800 text-white p-4">
          {/* Sidebar */}
        </nav>
        <main className="flex-1 p-4">
        {outlet}
        </main>
      </div>
    );
  }