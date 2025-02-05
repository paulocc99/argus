import { Typography } from '@mui/material';

export const HTypography = (props) => {
    const { variant, children } = props;
    return (
        <Typography variant={variant} sx={{ fontSize: '0.9rem' }}>
            {children}
        </Typography>
    );
};
