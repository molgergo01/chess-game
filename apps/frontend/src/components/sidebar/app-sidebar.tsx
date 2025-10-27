'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { ChevronUp, History, Swords, Trophy } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu';
import LogoutButton from '@/components/layout/logout-button-dropdown';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/dark-mode-toggle';
import { useAuth } from '@/hooks/auth/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFallbackNameAvatar } from '@/lib/utils/name.utils';

function AppSidebar() {
    const { userName, userAvatarUrl } = useAuth();

    const pathName = usePathname();
    const isLoginPage = pathName === '/login';

    if (isLoginPage) return null;

    const items = [
        {
            title: 'Play',
            url: '/play',
            icon: Swords,
            dataCy: 'sidebar-play'
        },
        {
            title: 'Leaderboard',
            url: '/leaderboard',
            icon: Trophy,
            dataCy: 'sidebar-leaderboard'
        },
        {
            title: 'History',
            url: '/games/history',
            icon: History,
            dataCy: 'sidebar-history'
        }
    ];

    return (
        <Sidebar variant={'sidebar'}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Chess Game</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton dataCy={item.dataCy} asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuSubItem className="text-right">
                        <ModeToggle />
                    </SidebarMenuSubItem>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton dataCy={'sidebar-profile-toggle'}>
                                    <Avatar className="size-7 flex-shrink-0 border-2" data-cy="banner-avatar">
                                        <AvatarImage src={userAvatarUrl || ''} />
                                        <AvatarFallback>{getFallbackNameAvatar(userName || '')}</AvatarFallback>
                                    </Avatar>{' '}
                                    {userName || 'Unknown user'}
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                                <DropdownMenuItem>
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <LogoutButton />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
