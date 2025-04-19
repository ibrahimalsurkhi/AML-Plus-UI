import { type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils';
import { useSettings } from '@/providers';
import { useLanguage } from '@/i18n';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components';
import { MenuSeparator } from '@/components/menu';

export const DropdownUser = () => {
  const { settings, storeSettings } = useSettings();
  const { logout, currentUser } = useAuthContext();

  const handleThemeMode = (event: ChangeEvent<HTMLInputElement>) => {
    const newThemeMode = event.target.checked ? 'dark' : 'light';
    storeSettings({
      themeMode: newThemeMode
    });
  };

  return (
    <>
      <div className="px-5 py-2">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img
              className="h-10 w-10 rounded-full"
              src={toAbsoluteUrl('/media/avatars/300-2.png')}
              alt=""
            />
          </div>
          <div className="ml-3">
            <div className="text-base font-medium text-gray-800">
              {currentUser?.userName || 'User'}
            </div>
            <div className="text-sm text-gray-500">
              {currentUser?.email}
            </div>
          </div>
        </div>
      </div>

      <MenuSeparator />
      
      <div className="px-5 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <KeenIcon icon="moon" className="mr-2 text-gray-500" />
            <span className="text-sm text-gray-700">Dark Mode</span>
          </div>
          <label className="switch switch-sm">
            <input
              name="theme-mode"
              type="checkbox"
              checked={settings.themeMode === 'dark'}
              onChange={handleThemeMode}
            />
          </label>
        </div>
      </div>

      <MenuSeparator />

      <div className="px-5 py-2">
        <button
          onClick={logout}
          className="flex w-full items-center text-left text-sm text-gray-700 hover:text-gray-900"
        >
          <KeenIcon icon="exit" className="mr-2 text-gray-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
};
