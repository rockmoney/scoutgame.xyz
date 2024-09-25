'use client';

import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { logoutAction } from '@connect-shared/lib/session/logoutAction';
import { Box, Container, IconButton, Menu, MenuItem, Toolbar, AppBar, Button, Typography, Stack } from '@mui/material';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { Avatar } from 'components/common/Avatar';

import { InstallAppMenuItem } from './components/InstallAppMenuItem';

// Enforce rendering on client side because the HeaderMenu component is rendered based on browser width. In RSC behaviour you see an element that should not be rendered.
const HeaderMenu = dynamic(() => import('./components/HeaderMenu').then((mod) => mod.HeaderMenu), {
  ssr: false
});

export function Header({ user }: { user: Pick<Scout, 'username' | 'avatar' | 'currentBalance'> | null }) {
  const router = useRouter();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const { execute: logoutUser, isExecuting: isExecutingLogout } = useAction(logoutAction, {
    onSuccess: async () => {
      revalidatePathAction();
      router.push('/');
    },
    onError(err) {
      log.error('Error on logout', { error: err.error.serverError });
    }
  });

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position='static'>
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', alignItems: 'center' }} variant='dense'>
          <>
            <Link href='/home'>
              <Image
                src='/images/scout-game-logo.png'
                width={100}
                height={45}
                alt='Scout Game logo'
                priority={true}
                style={{ verticalAlign: 'middle' }}
              />
            </Link>
            <Stack flexDirection='row' gap={2} alignItems='center'>
              <HeaderMenu />
              {user ? (
                <Box
                  display='flex'
                  alignItems='center'
                  gap={1}
                  borderColor='secondary.main'
                  borderRadius='30px'
                  sx={{ borderWidth: '2px', borderStyle: 'solid', pl: 1 }}
                >
                  <Typography variant='caption'>{user.currentBalance}</Typography>
                  <Image
                    src='/images/profile/scout-game-icon.svg'
                    width={20}
                    height={20}
                    alt='Scout Game points icon'
                    priority={true}
                  />
                  <IconButton disabled={isExecutingLogout} onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar src={user?.avatar || undefined} size='medium' name={user.username} />
                  </IconButton>
                  <Menu
                    sx={{ mt: 5 }}
                    id='menu-appbar'
                    slotProps={{
                      paper: { sx: { '.MuiList-root': { pb: 0 }, maxWidth: '250px' } }
                    }}
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right'
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right'
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                    onClick={handleCloseUserMenu}
                  >
                    <MenuItem>
                      <Link href='/profile'>{user.username}</Link>
                    </MenuItem>
                    <MenuItem onClick={() => logoutUser()}>Sign Out</MenuItem>
                    <InstallAppMenuItem>Install</InstallAppMenuItem>
                  </Menu>
                </Box>
              ) : (
                <Button variant='gradient' LinkComponent={Link} href='/login' data-test='sign-in-button'>
                  Sign in
                </Button>
              )}
            </Stack>
          </>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
