import { Fragment } from 'react';
import { useResponsive } from '@/hooks';
import {
  TMenuConfig,
  MenuItem,
  MenuLink,
  MenuTitle,
  MenuArrow,
  Menu,
  KeenIcon
} from '@/components';
import { MENU_MEGA } from '@/config';
import { useLanguage } from '@/i18n';

const MegaMenuInner = () => {
  const desktopMode = useResponsive('up', 'lg');
  const { isRTL } = useLanguage();

  const build = (items: TMenuConfig) => {
    const linkClass =
      'menu-link text-sm text-gray-700 font-medium menu-link-hover:text-primary menu-item-active:text-gray-900 menu-item-show:text-primary menu-item-here:text-gray-900';
    const titleClass = 'text-nowrap';

    return (
      <Fragment>
        {items.map((item, index) => (
          <MenuItem key={index}>
            <MenuLink path={item.path} className={linkClass}>
              <MenuTitle className={titleClass}>{item.title}</MenuTitle>
            </MenuLink>
          </MenuItem>
        ))}
      </Fragment>
    );
  };

  return (
    <Menu
      multipleExpand={true}
      highlight={true}
      className="flex-col lg:flex-row gap-5 lg:gap-7.5 p-5 lg:p-0"
    >
      {build(MENU_MEGA)}
    </Menu>
  );
};

export { MegaMenuInner };
