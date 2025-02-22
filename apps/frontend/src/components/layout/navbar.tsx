'use client';

import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/dark-mode-toggle';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import DropDownMenu from './dropdown';

export default function NavBar() {
    const pathName = usePathname();
    const isLoginPage = pathName === '/login';

    if (isLoginPage) return null;

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <NavigationMenuLink>Link</NavigationMenuLink>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <DropDownMenu />
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <ModeToggle />
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
