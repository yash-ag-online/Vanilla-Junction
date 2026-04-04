import { PackageIcon, SignOutIcon, SpinnerIcon, UserIcon, UsersIcon } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Link } from 'react-router';
import AdminOnly from './admin-only-component';
import { useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { toast } from 'sonner';

interface AccountDropDownProps {
  avatarUrl: string;
  avatarUrlAtl: string;
  avatarFallback: string | React.ReactElement;
}

const AccountDropDown = ({
  avatarUrl = '',
  avatarUrlAtl = 'avatar',
  avatarFallback = <UserIcon />,
}: Partial<AccountDropDownProps>) => (
  <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="flex items-center justify-center overflow-hidden">
          <Avatar className={'rounded-sm'}>
            <AvatarImage src={avatarUrl} alt={avatarUrlAtl} className={'rounded-sm'} />
            <AvatarFallback className={'rounded-sm'}>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link to={'/sign-out'} className="block">
            <DropdownMenuItem>
              <SignOutIcon />
              Sign Out
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
);

const menus: { content: React.ReactNode }[] = [
  {
    content: (
      <AdminOnly>
        <Link to={'/customers'}>
          <Button>
            <UserIcon /> <span className="hidden sm:inline">Customers</span>
          </Button>
        </Link>
      </AdminOnly>
    ),
  },
  {
    content: (
      <AdminOnly>
        <Link to={'/users'}>
          <Button>
            <UsersIcon /> <span className="hidden sm:inline">Users</span>
          </Button>
        </Link>
      </AdminOnly>
    ),
  },
  {
    content: (
      <AdminOnly>
        <Link to={'/orders'}>
          <Button>
            <PackageIcon /> <span className="hidden sm:inline">Orders</span>
          </Button>
        </Link>
      </AdminOnly>
    ),
  },
];

const Header = () => {
  const [loading, setLoading] = useState(false);
  const userContext = useUser();

  const signOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admins/me/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Something went wrong.');

      userContext?.fetchUser();
    } catch (error) {
      console.log(error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-12 flex items-center justify-between border-b bg-background">
      <div>
        <Link to={'/'} className="flex items-center gap-2">
          <img src="/logo.png" alt="logo" className="size-8" />{' '}
          <span className="hidden sm:inline">Vanilla Junction</span>
        </Link>
      </div>
      <nav>
        <ul className="flex gap-4 justify-end items-center">
          {menus.map((item, idx) => (
            <li key={`nav-manu-${idx}`}>{item.content}</li>
          ))}
          <li>
            {/* <AccountDropDown /> */}
            <Button variant={'destructive'} size={'icon'} onClick={signOut}>
              {loading ? <SpinnerIcon className="animate-spin" /> : <SignOutIcon />}
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
