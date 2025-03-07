import { Grid, Typography } from '@mui/material';

export default function NoData(props) {
    const { message, icon, height } = props;

    const gridSX = {
        mt: 2
    };

    if (height) gridSX.height = height;

    return (
        <Grid display="flex" justifyContent="center" alignItems="center" sx={gridSX}>
            {icon}
            <Typography style={{ color: 'gray' }} variant="body1">
                {message || 'No data'}
            </Typography>
        </Grid>
    );
}
