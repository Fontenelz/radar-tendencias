import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { TrendsRadar } from "./components/TrendsRadar";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Radar <span className="text-blue-600"><a href="https://imirante.com" target="_blank">Imirante.com</a></span>
            </h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1">
        <Content />
      </main>

      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Imirante.com - Radar imirante.com para Crescimento de Audiência</p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Authenticated>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {loggedInUser?.email?.split('@')[0]}!
          </h2>
          <p className="text-lg text-gray-600">
            Descubra as tendências que vão impulsionar sua audiência de 2M para 3M pageviews
          </p>
        </div>
        <TrendsRadar />
      </Authenticated>

      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Radar
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Identifique os assuntos mais buscados e crie conteúdo viral para o Imirante.com
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
