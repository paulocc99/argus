import { useTheme } from '@mui/material/styles';
import { Stack, Chip, Typography } from '@mui/material';

import Logo from 'components/Logo';
import DrawerHeaderStyled from './DrawerHeaderStyled';

const DrawerHeader = ({ open }) => {
    const theme = useTheme();

    return (
        <DrawerHeaderStyled theme={theme} open={open}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Logo />
                <Typography variant="h3">ARGUS</Typography>
                <Chip
                    label="v0.1"
                    size="small"
                    sx={{ height: 16, '& .MuiChip-label': { fontSize: '0.625rem', py: 0.25 } }}
                    component="a"
                    href="https://github.com/paulocc99/argus"
                    target="_blank"
                    clickable
                />
            </Stack>
        </DrawerHeaderStyled>
    );
};

export default DrawerHeader;
