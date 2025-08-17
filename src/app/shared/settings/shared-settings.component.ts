import { Component } from '@angular/core';

@Component({
  selector: 'app-shared-settings',
  template: `
    <div class="settings-container p-4">
      <h2 class="text-2xl font-bold mb-6">Account Settings</h2>
      
      <div class="settings-sections grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Profile Section -->
        <div class="col-span-2">
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h3 class="text-lg font-semibold mb-4">Profile Information</h3>
            
            <form class="space-y-4">
              <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="John">
                </div>
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="Doe">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="john.doe@example.com">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="(555) 123-4567">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3">123 Main St, Anytown, CA 12345</textarea>
              </div>
              
              <div class="pt-2">
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Password</h3>
            
            <form class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              
              <div class="pt-2">
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update Password</button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Preferences Section -->
        <div class="col-span-1">
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h3 class="text-lg font-semibold mb-4">Notification Preferences</h3>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm">Email Notifications</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm">SMS Notifications</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm">Appointment Reminders</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Theme</h3>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm">Dark Mode</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                <div class="flex space-x-2">
                  <button class="w-8 h-8 rounded-full bg-blue-600 ring-2 ring-offset-2 ring-blue-600"></button>
                  <button class="w-8 h-8 rounded-full bg-green-600"></button>
                  <button class="w-8 h-8 rounded-full bg-purple-600"></button>
                  <button class="w-8 h-8 rounded-full bg-red-600"></button>
                  <button class="w-8 h-8 rounded-full bg-gray-600"></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-8 border-t pt-6">
        <div class="flex justify-between items-center">
          <button class="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50">Delete Account</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save All Changes</button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SharedSettingsComponent {
  // Component logic would go here
}