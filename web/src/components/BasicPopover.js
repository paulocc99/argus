import * as React from 'react';
import { Stack, Button, Popover, IconButton } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

export default function BasicPopover(props) {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFilterBtn = (type) => {
        handleClose();
        props.func(type);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    return (
        <div>
            <IconButton aria-label="add" onClick={handleClick}>
                <AddCircleIcon color="success" fontSize="small" />
            </IconButton>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                }}
            >
                <Stack>
                    <Button variant="text" onClick={() => handleFilterBtn(0)}>
                        Simple Filter
                    </Button>
                    <Button variant="text" onClick={() => handleFilterBtn(1)}>
                        Painless Script
                    </Button>
                </Stack>
            </Popover>
        </div>
    );
}
