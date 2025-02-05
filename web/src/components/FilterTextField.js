import { styled } from '@mui/material/styles';
import { TextField } from '@mui/material';

const FilterTextField = styled(TextField)(({ theme }) => ({
    '& .MuiFormLabel-root': {
        background: 'none !important'
    },
    '& .MuiInputBase-input': {
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.5),
        fontSize: '0.875rem'
    }
}));

export default FilterTextField;
