import { Outlet, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import NeuralNetwork from '../three/NeuralNetwork';

export default function AuthLayout() {
  return (
    <div className="min-h-screen relative bg-gray-950">
      {/* Three.js Background */}
      <div className="fixed inset-0 z-0">
        <NeuralNetwork opacity={0.4} particleCount={2000} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/30 to-gray-950/50 z-10" />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-white">
              <Sparkles className="w-8 h-8 text-primary-400" />
              <span className="text-2xl font-bold">MyAIs</span>
            </Link>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50 p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
