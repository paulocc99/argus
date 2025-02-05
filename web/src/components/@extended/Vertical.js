import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';

const Vertical = ({ color, width, height, border }) => {
    const theme = useTheme();
    let main;
    switch (color) {
        case 'secondary':
            main = theme.palette.secondary.main;
            break;
        case 'error':
            main = theme.palette.error.main;
            break;
        case 'warning':
            main = theme.palette.warning.main;
            break;
        case 'info':
            main = theme.palette.info.main;
            break;
        case 'success':
            main = theme.palette.success.main;
            break;
        case 'primary':
        default:
            main = theme.palette.primary.main;
    }

    return (
        <Box
            sx={{
                width: width || 6,
                height: height || 25,
                borderRadius: border || '15%',
                bgcolor: main
            }}
        />
    );
};

export default Vertical;
