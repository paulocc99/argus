import { useState } from 'react';
import { Stack, Button, Popover, Fab } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

import { fabStyle } from 'themes/other';

export default function FabPopover(props) {
    const { func, icon } = props;
    const [anchorEl, setAnchorEl] = useState(null);

    // Handlers
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleBtn = (type) => {
        handleClose();
        func(type);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    return (
        <div>
            <Fab color="primary" sx={fabStyle} onClick={handleClick}>
                {icon}
            </Fab>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
            >
                <Stack>
                    <Button variant="text" startIcon={icon} onClick={() => handleBtn(0)}>
                        New Analytic
                    </Button>
                    <Button variant="text" startIcon={<SaveAltIcon />} onClick={() => handleBtn(1)}>
                        Import Analytic
                    </Button>
                </Stack>
            </Popover>
        </div>
    );
}
