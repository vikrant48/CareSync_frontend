import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div class="max-w-md w-full text-center space-y-8 animate-fade-in">
        
        <!-- Illustration / Icon -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center justify-center opacity-20 blur-xl">
            <div class="w-48 h-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob"></div>
            <div class="w-48 h-48 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000 ml-12"></div>
          </div>
          
          <div class="relative z-10">
            <h1 class="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 tracking-widest drop-shadow-2xl">
              404
            </h1>
            <div class="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full mt-2 mb-6 shadow-lg shadow-blue-500/50"></div>
          </div>
        </div>

        <!-- Message -->
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-white tracking-tight">Page Not Found</h2>
          <p class="text-gray-400 text-lg">
            Whoops! The page you are looking for seems to have vanished into the digital void.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <a routerLink="/" 
             class="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center gap-2">
            <i class="fas fa-home"></i>
            Go Home
          </a>
          
          <button onclick="history.back()" 
             class="w-full sm:w-auto px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 flex items-center justify-center gap-2">
            <i class="fas fa-arrow-left"></i>
            Go Back
          </button>
        </div>
        
      </div>
    </div>
  `,
    styles: [`
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class NotFoundComponent { }
